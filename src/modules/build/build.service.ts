import { Injectable } from '@nestjs/common'
import { extractTarball, getTarballURL } from '../../utils/npm'
import { PackageJson, writePackageJSON } from 'pkg-types'
import { validatePackagePathname } from '../../utils/validate'
import AsyncLock from 'async-lock'
import validateNpmPackageName from 'validate-npm-package-name'
import fs from 'fs-extra'
import path from 'path'
import {
  Error403Exception,
  Error500Exception,
} from '../../common/exception/errorStateException'
import {
  CACHE_DIR,
  ETC_DIR,
  BUILDS_DIR,
  //  POLYFILL_DIR
} from '../../constants'
import { resolvePackage } from './core/resolvePackage'
import { build as rollupBuild } from './core/rollupBuild'
import { outputErrorLog } from '../../utils/errorLog'

const lock = new AsyncLock()

@Injectable()
export class BuildService {
  constructor() {}

  async lockBuild(pathname?: string) {
    fs.ensureDirSync(ETC_DIR)
    const { packageName, packageVersion } = await validatePackagePathname(
      pathname,
    )
    return lock
      .acquire(
        `${packageName}@${packageVersion}`,
        this.build.bind(this, packageName, packageVersion),
      )
      .catch((err) => {
        outputErrorLog(err, packageName, packageVersion)
      })
  }

  async build(packageName: string, packageVersion: string) {
    validateNpmPackageName(packageName)

    // await validatePackageVersion(packageName, packageVersion)

    // await validatePackageConfig(packageName, packageVersion)

    const libDir = `${packageName}@${packageVersion}`
    const buildsPath = this.getBuildsPath(libDir)

    const isBuilded = fs.existsSync(path.join(buildsPath, 'package.json'))

    // Download npm to local
    const cachePath = this.getCachePath(packageName, packageVersion)

    const isCached = fs.existsSync(cachePath)

    if (isCached && isBuilded) {
      return
    }

    if (isBuilded) {
      throw new Error403Exception(
        `Package ${packageName}@${packageVersion} has already been built.`,
      )
    }

    if (!isCached) {
      const tarballURL = getTarballURL(packageName, packageVersion)

      await extractTarball(cachePath, tarballURL)
    }

    const pkgJson = await this.rewritePackage(cachePath)

    const { buildFiles, copyFiles } = await this.getFiles(cachePath, pkgJson)
    try {
      //   await buildFunc(buildFiles, buildsPath, cachePath)
      await rollupBuild(buildFiles, buildsPath, cachePath)
      await Promise.all(
        copyFiles.map((item) =>
          fs.copy(
            path.resolve(cachePath, item),
            path.resolve(buildsPath, item),
          ),
        ),
      )
    } catch (error: any) {
      throw new Error500Exception(error.toString())
    }
  }

  private async rewritePackage(cachePath: string) {
    const pkg = await resolvePackage(cachePath)
    await writePackageJSON(path.join(cachePath, 'package.json'), pkg)
    return pkg
  }

  private getCachePath(name: string, version: string) {
    return path.join(CACHE_DIR, name, version)
  }

  private getBuildsPath(name: string) {
    return path.join(BUILDS_DIR, name)
  }

  private async getFiles(cachePath: string, pkgJson: PackageJson) {
    const files = pkgJson?.files ?? []
    const copyFiles: string[] = []

    copyFiles.push('package.json')

    let buildFiles = files.filter((item) => {
      const ext = path.extname(item)
      if (!ext) {
        return false
      }
      if (!fs.existsSync(path.join(cachePath, item))) {
        return false
      }

      if (item === 'package.json') {
        return true
      }
      if (item === 'package.json.js') {
        return false
      }
      if (item.endsWith('.mjs') || item.endsWith('.ts')) {
        copyFiles.push(item)
        return false
      }
      if (item.endsWith('.js')) {
        return true
      }
      if (!item.endsWith('.map')) {
        copyFiles.push(item)
      }
      return false
    })

    buildFiles = buildFiles.map((item) => path.resolve(cachePath, item))

    return { buildFiles, copyFiles }
  }
}
