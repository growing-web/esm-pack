import { Injectable } from '@nestjs/common'
import { PackageJson, writePackageJSON, readPackageJSON } from 'pkg-types'
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
  isEsmFile,
  //   brotliCompressDir,
  minifyEsmFiles,
  createLogger,
  isInternalScope,
  semver,
} from '@growing-web/esmpack-shared'
import { RedisLock, createRedisClient } from '@/plugins/redis'
import { getOverrides } from './overrides'

@Injectable()
export class BuildService {
  private readonly logger = createLogger(BuildService.name)
  constructor() {}

  async build(pathname: string | undefined, needBuild = true) {
    // 确保构建文件存在
    fs.ensureDirSync(ESM_DIR)

    const { packageName, packageVersion } =
      await this.validateAndParsedPackagePathname(pathname)

    this.logger.debug('package:', {
      packageName,
      packageVersion,
    })
    const lockKey = `build:${packageName}@${packageVersion}`
    this.logger.debug('lockKey', lockKey)
    const redisClient = createRedisClient()
    const redisLock = new RedisLock(redisClient)
    // const redisUtil = new RedisUtil()

    try {
      //   const isProcessing = await redisUtil.get(lockKey)

      //   if (isProcessing) {
      //     throw new ForbiddenException(
      //       `ESMPACK is still processing ${packageName}@${packageVersion}, this can take a few minutes!`,
      //     )
      //   }
      //   await redisUtil.set(lockKey, '1', 10)

      // Redis 分布式锁，防止执行相同的包构建任务
      await redisLock.lock(lockKey, 40 * 1000, 50, 10)

      await this.doBuild(packageName, packageVersion, needBuild)
    } catch (error: any) {
      if (error.toString().includes('RedisLock')) {
        throw new ForbiddenException(
          `ESMPACK is still processing ${packageName}@${packageVersion}, this can take a few minutes!`,
        )
      }
      redisLock.unlock(lockKey)
      throw error
    } finally {
      redisLock.unlock(lockKey)
    }
  }

  async doBuild(packageName: string, packageVersion: string, needBuild = true) {
    // 检测包名或者版本号是否存在
    if (!packageVersion || !packageName) {
      throw new NotFoundException(
        `Cannot find package ${packageName || ''}@${packageVersion || ''}`,
      )
    }

    // 检测包名是否规范
    await this.validateNpmPackageName(packageName)

    // 获取上传的文件夹路径
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

    // 从npm下载文件到本地缓存文件夹
    const sourcePath = this.getSourcePath(packageName, packageVersion)
    if (!fs.existsSync(sourcePath)) {
      const notFoundError = () => {
        throw new NotFoundException(
          `Package ${packageName}@${packageVersion} not found in the npm registry.`,
        )
      }
      try {
        const tarballURL = await getTarballURL(packageName, packageVersion)
        console.log('tarballURL', tarballURL)
        if (!tarballURL) {
          notFoundError()
        }

        const headers = isInternalScope(packageName)
          ? {
              Authorization: `Bearer ${process.env.NPM_TOKEN}`,
            }
          : {}
        await extractTarball(sourcePath, tarballURL!, headers)
      } catch (error) {
        notFoundError()
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

    // HACK 处理 Node.js 模块可能存在构建问题
    if (packageName === '@jspm/core') {
      await fs.copy(sourcePath, outputPath)
      return
    }

    // 重写一些匹配的包
    await this.overridesInfo(sourcePath)

    const startTime = new Date().getTime()
    // 重写 package.json
    const packageJson = await this.rewritePackage(sourcePath)

    try {
      if (needBuild) {
        const { buildFiles, needCopyFiles } = await this.getFiles(
          sourcePath,
          packageJson,
        )

        // 清空可能存在的构建输出文件
        await fs.remove(outputPath)

        const buildJsFiles: string[] = []
        const buildPkgFiles: string[] = []
        for (const file of buildFiles) {
          if (path.basename(file) === PACKAGE_JSON) {
            buildPkgFiles.push(file)
          } else {
            buildJsFiles.push(file)
          }
        }

        const esmBuild = async () => {
          await fs.copy(sourcePath, outputPath)
          await minifyEsmFiles(outputPath)
          // 压缩 br 文件
          //   await brotliCompressDir(outputPath)
          // 构建 package.json
          await build({
            buildFiles: buildPkgFiles,
            sourcePath,
            outputPath,
            entryFiles: [],
            brotlfy: false,
          })
        }

        // package.json内 如果有 esmpack字段
        // 且 esmd=true，则表示改包已经符合esm规范，不需要进行构建，直接上传
        if (packageJson?.esmpack?.esmd) {
          await esmBuild()
        } else {
          // 只有一个入口，判断是否符合es 格式，若符合，则不进行构建优化
          let isEsm = false

          if (buildJsFiles.length === 1) {
            const file = buildJsFiles[0]
            isEsm = await isEsmFile(
              fs.readFileSync(file, { encoding: 'utf-8' }),
            )

            // 符合 es 格式 直接拷贝
            if (isEsm) {
              await esmBuild()
            }
          }

          // 入口文件不是esm，继续执行构建
          if (!isEsm) {
            const entryFiles = this.getEntryFiles(packageJson, sourcePath)
            // 执行构建

            await build({
              buildFiles,
              sourcePath,
              outputPath,
              entryFiles,
              brotlfy: false,
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
          }
        }
      } else {
        await fs.copy(sourcePath, outputPath)
        await minifyEsmFiles(outputPath)
        // await brotliCompressDir(outputPath)
      }

      const duration = (new Date().getTime() - startTime) / 1000
      console.log(
        `${colors.green(`build complete`)}:  ${colors.cyan(
          `${packageName}@${packageVersion}`,
        )}, cost ${colors.cyan(`${duration.toFixed(2)}s`)}`,
      )
      console.log('')

      // upload oss
      await originAdapter.uploadDir({
        cwd: outputPath,
        uploadDir,
      })

      // 清空输出目录，防止构建累计，导致文件过多
      Promise.all([fs.remove(outputPath), fs.remove(sourcePath)])
    } catch (error: any) {
      console.log(error)
      throw new InternalServerErrorException(error.toString())
    }
  }

  private async rewritePackage(cachePath: string) {
    const pkg = await resolvePackage(cachePath)
    await writePackageJSON(path.join(cachePath, PACKAGE_JSON), pkg)
    return pkg
  }

  /**
   * 检查路径是否符合规范，并返回解析后的值
   * @param pathname
   * @returns
   */
  async validateAndParsedPackagePathname(pathname?: string) {
    const parsed = parsePackagePathname(pathname)

    if (parsed == null) {
      throw new ForbiddenException(`Invalid URL: ${pathname}`)
    }
    return parsed
  }

  /**
   * 检查路径是否符合规范
   * @param pathname
   * @returns
   */
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

    const entryPoint = pkgExports['.']

    let exportsEntryFiles: string[] = []
    if (typeof entryPoint === 'string') {
      exportsEntryFiles = [entryPoint]
    } else {
      exportsEntryFiles = recursionExportsValues(pkgExports['.'])
    }

    entryFiles = exportsEntryFiles.filter((file) => {
      return !path.basename(file).startsWith('dev.')
    })

    // const fields = ['module', 'main', 'unpkg', 'jsdelivr']
    const fields = ['browser', 'module', 'main', 'unpkg', 'jsdelivr']
    fields.forEach((field) => {
      const file = packageJson[field]
      if (typeof file === 'string') {
        entryFiles.push(file)
      } else {
        // @ts-ignore typo
        entryFiles.push(...Object.values(file || {}))
      }
    })

    entryFiles = entryFiles.filter((file) => typeof file === 'string')

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

  /**
   * 获取npm源文件下载目录
   */
  private getSourcePath(name: string, version: string, ...args: string[]) {
    return path.join(SOURCE_DIR, name, version, ...args)
  }

  /**
   * 获取oss文件上传目录
   */
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

  private async overridesInfo(sourcePath: string) {
    const json = await readPackageJSON(sourcePath)
    const packageName = json.name
    const packageVersion = json.version

    if (!packageName || !packageVersion) {
      return {}
    }

    try {
      const overrides = await getOverrides(packageName)

      if (!overrides || !Array.isArray(overrides)) {
        return {}
      }

      let matchRange: any = null

      for (const override of overrides) {
        if (matchRange) {
          continue
        }
        if (semver.satisfies(packageVersion, override.range)) {
          matchRange = override
        }
      }

      const overridesPackage = matchRange?.package

      if (!overridesPackage) {
        return overrides
      }

      //   只允许覆盖 exports、files、main、module
      if (overridesPackage?.exports) {
        const jsonExports =
          typeof json?.exports === 'string'
            ? { '.': json?.exports }
            : json?.exports ?? {}

        json.exports = {
          ...jsonExports,
          ...(overridesPackage?.exports ?? {}),
        }
      }

      if (overridesPackage.files) {
        json.files = [
          ...(json?.files ?? []),
          ...(overridesPackage?.files ?? []),
        ]
      }

      json.main = overridesPackage?.main ?? json.main
      json.module = overridesPackage?.module ?? json.module

      await writePackageJSON(path.join(sourcePath, PACKAGE_JSON), json)
      return json
    } catch (error) {
      console.error(error)
      return {}
    }
  }
}
