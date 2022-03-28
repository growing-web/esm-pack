import { Injectable } from '@nestjs/common'
import { AppException } from '../../common/exception'
import {
  getNpmPackageInfo,
  getNpmTarball,
  getAndExtractTarball,
} from '../../utils/npm'
import { Semver } from 'sver'
import fs from 'fs-extra'
import { PackageJson, readPackageJSON, writePackageJSON } from 'pkg-types'
import path from 'path'
// import { build } from 'esbuild'
import { resolveExports } from './core/resolve-exports'
import { resolveFiles } from './core/resolve-files'
import { build } from './core/'
import { init } from 'es-module-lexer'
import validateNpmPackageName from 'validate-npm-package-name'

const PACKAGE_RE = /^((?:@[^/\\%@]+\/)?[^./\\%@][^/\\%@]*)@([^\\/]+)(\/.*)?$/

const TEMP_DIR = '.temp'
const PUBLIC_DIR = 'public'
const PROCESS_STATE = '__process__'

@Injectable()
export class BuildService {
  constructor() {}

  async build(info?: string) {
    if (!info) {
      throw new AppException('wrong access path.')
    }

    const match = info.match(PACKAGE_RE)

    if (!match || !match?.[2]) {
      throw new AppException(
        'A versioned package name of the format [name]@[version] must be provided.',
      )
    }

    const [, name, version] = match

    if (!Semver.isValid(version)) {
      throw new AppException(
        `Invalid version ${version}. Only exact semver versions are supported.`,
      )
    }

    const errors = validateNpmPackageName(name).errors

    if (errors) {
      const reason = errors.join(', ')
      throw new AppException(`Invalid package name "${name}" (${reason})`)
    }

    const npmInfo = await getNpmPackageInfo(name)
    if (!npmInfo) {
      throw new AppException(
        `Invalid version ${version}. The current version does not exist.`,
      )
    }

    // Download npm to local
    const tempPath = this.getTempPath(name, version)
    const cdnDir = `npm:${name}@${version}`
    const outDir = this.getpublicPath(cdnDir)

    if (fs.existsSync(outDir)) {
      throw new AppException(
        `Package ${name}@${version} has already been built.`,
      )
    }

    const processFile = path.join(tempPath, PROCESS_STATE)
    if (fs.existsSync(processFile)) {
      throw new AppException(
        `Package ${name} under construction，please wait a few minutes！`,
      )
    }

    fs.ensureFile(processFile)

    let tarball = ''

    try {
      tarball = await getNpmTarball(npmInfo, version)
    } catch (error) {
      fs.removeSync(processFile)
    }

    if (!tarball) {
      throw new AppException(
        `Invalid version ${version}. The current version does not exist.`,
      )
    }

    await getAndExtractTarball(tempPath, tarball)

    const pkgJson = await this.rewritePackage(tempPath)

    const { buildFiles, copyFiles } = await this.getFiles(tempPath, pkgJson)

    await build(buildFiles, outDir, tempPath)

    await Promise.all(
      copyFiles.map((item) => {
        return fs.copy(path.resolve(tempPath, item), path.resolve(outDir, item))
      }),
    )

    // const files = await fg('*', { cwd: outDir })
    // const uploadFiles = files.map((file) => ({
    //   file,
    //   fullPath: path.resolve(outDir, file),
    // }))
    // await uploadOss(uploadFiles, cdnDir)
    fs.remove(tempPath)
  }

  private async rewritePackage(tempPath: string) {
    const pkg = await readPackageJSON(tempPath)

    const pkgExports = await resolveExports(pkg, tempPath)
    const files = await resolveFiles(pkg, tempPath, pkgExports)
    pkg.exports = pkgExports
    pkg.files = files
    await writePackageJSON(path.join(tempPath, 'package.json'), pkg)
    return pkg
  }

  private getTempPath(name: string, version: string) {
    return path.resolve(process.cwd(), TEMP_DIR, name, version)
  }

  private getpublicPath(name: string) {
    return path.resolve(process.cwd(), PUBLIC_DIR, name)
  }

  private async getFiles(tempPath: string, pkgJson: PackageJson) {
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
      if (item.endsWith('js')) {
        return true
      }
      if (!item.endsWith('.map')) {
        copyFiles.push(item)
      }
      return false
    })

    await init

    buildFiles = buildFiles.map((item) => path.resolve(tempPath, item))

    return { buildFiles, copyFiles }
  }
}
