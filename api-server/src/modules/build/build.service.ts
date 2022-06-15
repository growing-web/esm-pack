import { Injectable } from '@nestjs/common'
import { PackageJson, writePackageJSON } from 'pkg-types'
import { createOriginAdapter } from '@/originAdapter'
import fs from 'fs-extra'
import path from 'node:path'
import colors from 'picocolors'
import { Logger } from '@/plugins/logger'
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@/common/exception/errorStateException'
import {
  SOURCE_DIR,
  ESM_DIR,
  OUTPUT_DIR,
  PACKAGE_JSON,
  BUCKET_NPM_DIR,
  ESMPACK_ESMD_FILE,
} from '@/constants'
import {
  build,
  resolvePackage,
  recursionExportsValues,
} from '@growing-web/esmpack-builder'
import {
  parsePackagePathname,
  extractTarball,
  getTarballURL,
  validateNpmPackageName,
} from '@growing-web/esmpack-shared'
import { RedisLock, RedisUtil, createRedisClient } from '@/plugins/redis'

// const lock = new AsyncLock()

@Injectable()
export class BuildService {
  constructor() {}

  async build(pathname: string | undefined, needBuild = true) {
    // 确保构建文件存在
    fs.ensureDirSync(ESM_DIR)

    const { packageName, packageVersion } = await this.validatePackagePathname(
      pathname,
    )
    const lockKey = `build:${packageName}@${packageVersion}`
    const redisClient = createRedisClient()
    const redisLock = new RedisLock(redisClient)
    const redisUtil = new RedisUtil()

    try {
      const isProcessing = await redisUtil.get(lockKey)

      if (isProcessing) {
        throw new ForbiddenException(
          `ESMPACK is still processing ${packageName}@${packageVersion}, this can take a few minutes!`,
        )
      }
      await redisUtil.set(lockKey, '1')

      // Redis 分布式锁，防止执行相同的包构建任务
      await redisLock.lock(lockKey, 5 * 60 * 1000, 50, 100)

      await this.doBuild(packageName, packageVersion, needBuild)
      await redisUtil.del(lockKey)
    } catch (error) {
      await redisUtil.del(lockKey)
      redisLock.unlock(lockKey)
      throw error
    } finally {
      await redisUtil.del(lockKey)
      redisLock.unlock(lockKey)
    }

    /**
     * Node.js 进程锁，防止同一个线程执行相同的包构建任务
     */
    // const lockKey = `build-${packageName}@${packageVersion}`
    // return lock
    //   .acquire(
    //     lockKey,
    //     this.doBuild.bind(this, packageName, packageVersion, needBuild),
    //   )
    //   .catch((err) => {
    //     // 记录错误信息到构建目录对应包下面的 _error.json 文件
    //     throw err
    //   })
  }

  //   async build(pathname: string | undefined, needBuild = true) {
  //     // 确保构建文件存在
  //     fs.ensureDirSync(ESM_DIR)

  //     const { packageName, packageVersion } = await this.validatePackagePathname(
  //       pathname,
  //     )

  //     /**
  //      * Node.js 进程锁，防止同一个线程执行相同的包构建任务
  //      */
  //     const lockKey = `build-${packageName}@${packageVersion}`
  //     return lock
  //       .acquire(
  //         lockKey,
  //         this.doBuild.bind(this, packageName, packageVersion, needBuild),
  //       )
  //       .catch((err) => {
  //         // 记录错误信息到构建目录对应包下面的 _error.json 文件
  //         // outputErrorLog(err, packageName, packageVersion)
  //         throw err
  //       })
  //   }

  async doBuild(packageName: string, packageVersion: string, needBuild = true) {
    // 检测包名或者版本号是否存在
    if (!packageVersion || !packageName) {
      throw new NotFoundException(
        `Cannot find package ${packageName || ''}@${packageVersion || ''}`,
      )
    }

    // 检测包名是否规范
    await this.validateNpmPackageName(packageName)

    const uploadDir = this.getUploadDir(packageName, packageVersion)

    const originAdapter = createOriginAdapter()
    // 判断是否已经在OSS内存在，如已存在，则跳过
    const isExistObject = await originAdapter.isExistObject(
      path.join(uploadDir, ESMPACK_ESMD_FILE),
    )

    if (isExistObject) {
      throw new ForbiddenException(
        `Package ${packageName}@${packageVersion} has already been built.`,
      )
    }

    const outputPath = path.join(OUTPUT_DIR, packageName, packageVersion)

    // 创建一个文件 __esmpack_processing__,表示当前 包@版本 正在构建
    // 可能有多个服务同时构建一个包，此时需要保证只有一个任务在进行
    // 同时上传到OSS
    // const processingFile = path.join(outputPath, ESMPACK_PROCESSING_FILE)

    // // 判断是否已经在构建中，如正在构建中，则中止
    // const isExistProcess = await originAdapter.isExistObject(
    //   path.join(uploadDir, ESMPACK_PROCESSING_FILE),
    // )

    // if (isExistProcess) {
    //   throw new ForbiddenException(
    //     `ESMPACK is still processing ${packageName}@${packageVersion}, this can take a few minutes!`,
    //   )
    // }

    // 从npm下载文件到本地缓存文件夹

    const sourcePath = this.getSourcePath(packageName, packageVersion)
    if (!fs.existsSync(sourcePath)) {
      //   let packageConfig
      //   try {
      //     packageConfig = await getPackageConfig(packageName, packageVersion)
      //     if (!packageConfig) {
      //       await this.deleteProcessFile(uploadDir)
      //       throw new Error()
      //     }
      //   } catch (_) {
      //     await this.deleteProcessFile(uploadDir)
      //     throw new NotFoundException(
      //       `Package ${packageName}@${packageVersion} not found in the npm registry.`,
      //     )
      //   }
      try {
        const tarballURL = await getTarballURL(packageName, packageVersion)

        await extractTarball(sourcePath, tarballURL)
      } catch (error) {
        throw new NotFoundException(
          `Package ${packageName}@${packageVersion} not found in the npm registry.`,
        )
      }
    }

    // 判断是否下载成功
    const downloadTarballSuccess = fs.existsSync(
      this.getSourcePath(packageName, packageVersion, PACKAGE_JSON),
    )

    if (!downloadTarballSuccess) {
      throw new NotFoundException(
        `Package ${packageName}@${packageVersion} not found in the npm registry.`,
      )
    }

    // fs.outputFileSync(processingFile, ESMPACK_PROCESSING_FILE, {
    //   encoding: 'utf-8',
    // })
    // await originAdapter.put({
    //   cwd: outputPath,
    //   uploadDir,
    //   file: processingFile,
    // })

    // HACK 处理 Node.js 模块可能存在构建问题
    if (packageName === '@jspm/core') {
      await fs.copy(sourcePath, outputPath)
      return
    }

    try {
      if (needBuild) {
        // 重写 package.json
        const packageJson = await this.rewritePackage(sourcePath)

        const { buildFiles, needCopyFiles } = await this.getFiles(
          sourcePath,
          packageJson,
        )

        // 清空可能存在的构建输出文件
        await fs.remove(outputPath)

        const entryFiles = this.getEntryFiles(packageJson, sourcePath)
        // 执行构建

        const startTime = new Date().getTime()

        await build({
          buildFiles,
          sourcePath,
          outputPath,
          entryFiles,
        })

        // 拷贝其余文件到构建输出目录
        await Promise.all(
          needCopyFiles.map((file) =>
            fs.copy(
              path.resolve(sourcePath, file),
              path.resolve(outputPath, file),
            ),
          ),
        )

        const duration = (new Date().getTime() - startTime) / 1000
        console.log(
          `${colors.green(`build complete`)}:  ${colors.cyan(
            `${packageName}@${packageVersion}`,
          )}, cost ${colors.cyan(`${duration.toFixed(2)}s`)}`,
        )
        console.log('')
      } else {
        await fs.copy(sourcePath, outputPath)
      }

      //   upload oss
      await originAdapter.uploadDir({
        cwd: outputPath,
        uploadDir,
      })

      //  表示上传成功，后续根据该文件判断是否已经转换过
      const esmdFile = path.join(outputPath, ESMPACK_ESMD_FILE)
      fs.outputFileSync(esmdFile, ESMPACK_ESMD_FILE, {
        encoding: 'utf-8',
      })
      await originAdapter.put({
        cwd: outputPath,
        uploadDir,
        file: esmdFile,
      })

      // 清空输出目录，防止构建累计，导致文件过多
      await Promise.all([fs.remove(outputPath), fs.remove(sourcePath)])
      // 无论转换是否失败，最后都删除处理中的文件
      //   await this.deleteProcessFile(uploadDir)
    } catch (error: any) {
      //   await this.deleteProcessFile(uploadDir)
      throw new InternalServerErrorException(error.toString())
    }
  }

  //   private async deleteProcessFile(uploadDir: string) {
  //     const originAdapter = createOriginAdapter()
  //     // 无论转换是否失败，最后都删除处理中的文件
  //     await originAdapter.deleteFile(
  //       path.join(uploadDir, ESMPACK_PROCESSING_FILE),
  //     )
  //   }

  private async rewritePackage(cachePath: string) {
    const pkg = await resolvePackage(cachePath)
    await writePackageJSON(path.join(cachePath, PACKAGE_JSON), pkg)
    return pkg
  }

  async validatePackagePathname(pathname?: string) {
    const parsed = parsePackagePathname(pathname)

    if (parsed == null) {
      throw new ForbiddenException(`Invalid URL: ${pathname}`)
    }
    return parsed
  }

  async validateNpmPackageName(packageName: string) {
    const reason = await validateNpmPackageName(packageName)

    if (reason) {
      throw new ForbiddenException(
        `Invalid package name "${packageName}" (${reason})`,
      )
    }
  }

  private getEntryFiles(packageJson: PackageJson, sourcePath: string) {
    let entryFiles: string[] = []
    const pkgExports = packageJson.exports as Record<string, any>
    const exportsEntryFiles = recursionExportsValues(pkgExports['.'])

    entryFiles = exportsEntryFiles.filter((file) => {
      return !path.basename(file).startsWith('dev.')
    })

    const fields = ['browser', 'module', 'main', 'unpkg', 'jsdelivr']
    fields.forEach((field) => {
      const file = packageJson[field]
      if (file) {
        entryFiles.push(file)
      }
    })
    entryFiles = entryFiles.map((file) => {
      return path.join(sourcePath, file)
    })

    entryFiles = entryFiles.filter((file) => {
      return (
        fs.existsSync(file) &&
        (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.mjs'))
      )
    })
    entryFiles = Array.from(new Set(entryFiles))
    return entryFiles
  }

  private getSourcePath(name: string, version: string, ...args: string[]) {
    return path.join(SOURCE_DIR, name, version, ...args)
  }

  private getUploadDir(packageName: string, packageVersion: string) {
    return `${BUCKET_NPM_DIR}/${packageName}@${packageVersion}/`
  }

  private async getFiles(cachePath: string, pkgJson: PackageJson) {
    const { files = [], browser = {} } = pkgJson
    const needCopyFiles: string[] = []

    needCopyFiles.push(PACKAGE_JSON)

    let buildFiles = files.filter((file) => {
      if (file === `${PACKAGE_JSON}.js`) {
        return false
      }
      if (!fs.existsSync(path.join(cachePath, file))) {
        if (!path.basename(file).startsWith('dev.')) {
          Logger.warn(
            `Package(${colors.cyan(
              pkgJson.name,
            )}): Potential missing package.json files: ${colors.cyan(file)}`,
          )
        }

        return false
      }

      if (file === PACKAGE_JSON || /\.[m|c]?js$/.test(file)) {
        return true
      }

      if (file.endsWith('.d.ts')) {
        needCopyFiles.push(file)
        return false
      }

      if (!file.endsWith('.map')) {
        needCopyFiles.push(file)
      }
      return false
    })

    buildFiles = buildFiles.map((item) => path.resolve(cachePath, item))

    for (const key of Object.keys(browser)) {
      buildFiles = buildFiles.filter((item) => {
        const name = path.relative(cachePath, item)
        return path.join(name) !== path.join(key)
      })
    }

    return { buildFiles, needCopyFiles }
  }
}
