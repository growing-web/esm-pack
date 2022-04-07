import { Injectable } from '@nestjs/common'
import { extractTarball, getTarballURL } from '@/utils/npm'
import { PackageJson, writePackageJSON } from 'pkg-types'
import {
  validatePackagePathname,
  validatePackageConfig,
} from '@/utils/validate'
import {
  Error403Exception,
  Error500Exception,
} from '@/common/exception/errorStateException'
import { CACHE_DIR, ETC_DIR, BUILDS_DIR, PACKAGE_JSON } from '@/constants'
import { resolvePackage } from './core/resolvePackage'
import { build as rollupBuild } from './core/rollupBuild'
import { outputErrorLog } from '@/utils/errorLog'
import { Logger } from '@/plugins/logger'
import validateNpmPackageName from 'validate-npm-package-name'
import fs from 'fs-extra'
import path from 'path'
import AsyncLock from 'async-lock'
import { Error404Exception } from '../../common/exception/errorStateException'

const lock = new AsyncLock()

@Injectable()
export class BuildService {
  constructor() {}

  async build(pathname: string | undefined, force: boolean) {
    fs.ensureDirSync(ETC_DIR)
    const { packageName, packageVersion } = await validatePackagePathname(
      pathname,
    )
    return lock
      .acquire(
        `${packageName}@${packageVersion}`,
        this.doBuild.bind(this, packageName, packageVersion, force),
      )
      .catch((err) => {
        Logger.error(err)
        outputErrorLog(err, packageName, packageVersion)
        throw err
      })
  }

  async doBuild(packageName: string, packageVersion: string, force = false) {
    validateNpmPackageName(packageName)

    // await validatePackageVersion(packageName, packageVersion)

    const libDir = `${packageName}@${packageVersion}`
    const buildsPath = this.getBuildsPath(libDir)

    const isBuilded = fs.existsSync(path.join(buildsPath, PACKAGE_JSON))

    // Download npm to local
    const cachePath = this.getCachePath(packageName, packageVersion)

    const isCached = fs.existsSync(cachePath)

    if (isCached && isBuilded && !force) {
      return
    }

    if (isBuilded && !force) {
      throw new Error403Exception(
        `Package ${packageName}@${packageVersion} has already been built.`,
      )
    }

    if (!isCached && !force) {
      isCached && (await fs.remove(cachePath)) // force=true
      await validatePackageConfig(packageName, packageVersion)
      const tarballURL = getTarballURL(packageName, packageVersion)
      await extractTarball(cachePath, tarballURL)
    }

    const downloadTarballSuccess = fs.existsSync(
      this.getCachePath(packageName, packageVersion, PACKAGE_JSON),
    )

    if (!downloadTarballSuccess) {
      throw new Error404Exception(
        `Cannot find package ${packageName}@${packageVersion}`,
      )
    }

    const pkgJson = await this.rewritePackage(cachePath)

    const { buildFiles, copyFiles } = await this.getFiles(cachePath, pkgJson)
    try {
      await fs.remove(buildsPath) // force=true
      await rollupBuild(buildFiles, buildsPath, cachePath, pkgJson)
      await Promise.all(
        copyFiles.map((item) =>
          fs.copy(
            path.resolve(cachePath, item),
            path.resolve(buildsPath, item),
          ),
        ),
      )
      Reflect.deleteProperty(pkgJson, '__ESMD__')
      await writePackageJSON(path.join(buildsPath, 'package.json'), pkgJson)
    } catch (error: any) {
      throw new Error500Exception(error.toString())
    }
  }

  private async rewritePackage(cachePath: string) {
    const pkg = await resolvePackage(cachePath)
    await writePackageJSON(path.join(cachePath, 'package.json'), pkg)
    return pkg
  }

  private getCachePath(name: string, version: string, ...args: string[]) {
    return path.join(CACHE_DIR, name, version, ...args)
  }

  private getBuildsPath(name: string) {
    return path.join(BUILDS_DIR, name)
  }

  private async getFiles(cachePath: string, pkgJson: PackageJson) {
    const { files = [], browser = {} } = pkgJson
    const copyFiles: string[] = []

    copyFiles.push('package.json')

    let buildFiles = files.filter((file) => {
      if (
        !fs.existsSync(path.join(cachePath, file)) ||
        file === 'package.json.js'
      ) {
        return false
      }

      if (file === 'package.json' || /\.[m|c]?js$/.test(file)) {
        return true
      }

      if (file.endsWith('.ts')) {
        copyFiles.push(file)
        return false
      }

      if (!file.endsWith('.map')) {
        copyFiles.push(file)
      }
      return false
    })

    buildFiles = buildFiles.map((item) => path.resolve(cachePath, item))

    for (const [key] of Object.entries(browser)) {
      buildFiles = buildFiles.filter((item) => {
        const name = path.relative(cachePath, item)
        return path.join(name) !== path.join(key)
      })
    }

    return { buildFiles, copyFiles }
  }
}
