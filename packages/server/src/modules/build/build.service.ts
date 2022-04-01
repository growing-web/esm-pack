import { Injectable } from '@nestjs/common'
import { extractTarball, getTarballURL } from '../../utils/npm'
import { PackageJson, readPackageJSON, writePackageJSON } from 'pkg-types'
import { resolveExports } from './core/resolveExports'
import { resolveFiles } from './core/resolveFiles'
import { build } from './core/build'
// import { init } from 'es-module-lexer'
import validateNpmPackageName from 'validate-npm-package-name'
import fs from 'fs-extra'
import path from 'path'
import {
  validatePackageConfig,
  validatePackagePathname,
  validatePackageVersion,
} from '../../utils/validate'
import AsyncLock from 'async-lock'
import { Error403Exception } from '../../common/exception/errorStateException'
import { CACHE_DIR, ETC_DIR, POLYFILL_DIR } from '../../constants'
import { BUILDS_DIR } from '../../constants/index'

const lock = new AsyncLock()

;(() => {
  // init polyfills
  const polyfillsDir = path.join(BUILDS_DIR, POLYFILL_DIR)
  if (!fs.existsSync(polyfillsDir)) {
    fs.copy(path.join(process.cwd(), 'polyfills'), polyfillsDir)
  }
})()

@Injectable()
export class BuildService {
  constructor() {}

  async lockBuild(pathname?: string) {
    fs.ensureDirSync(ETC_DIR)
    const { packageName, packageVersion } = await validatePackagePathname(
      pathname,
    )

    await lock.acquire(
      `${packageName}@${packageVersion}`,
      this.build.bind(this, pathname),
    )
  }

  async build(pathname?: string) {
    const { packageName, packageVersion } = await validatePackagePathname(
      pathname,
    )

    await validateNpmPackageName(packageName)

    await validatePackageVersion(packageName, packageVersion)

    await validatePackageConfig(packageName, packageVersion)

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

    await build(buildFiles, buildsPath, cachePath)

    await Promise.all(
      copyFiles.map((item) =>
        fs.copy(path.resolve(cachePath, item), path.resolve(buildsPath, item)),
      ),
    )
  }

  private async rewritePackage(cachePath: string) {
    const pkg = await readPackageJSON(cachePath)
    const pkgExports = await resolveExports(pkg, cachePath)
    const files = await resolveFiles(pkg, cachePath, pkgExports)
    pkg.exports = pkgExports
    pkg.files = files
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
