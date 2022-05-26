import { ForbiddenException, NotFoundException } from '../common/exception'
import { resolvePackageVersion, parsePackagePathname } from './package'
import { getPackageConfig } from './npm'
import validatePackageName from 'validate-npm-package-name'

export async function validatePackagePathname(pathname?: string) {
  if (!pathname) {
    throw new ForbiddenException(`Invalid URL: ${pathname}`)
  }

  const parsed = parsePackagePathname(pathname)

  if (parsed == null) {
    throw new ForbiddenException(`Invalid URL: ${pathname}`)
  }
  return parsed
}

export async function validateNpmPackageName(packageName: string) {
  const errors = validatePackageName(packageName).errors

  if (errors) {
    const reason = errors.join(', ')

    throw new ForbiddenException(
      `Invalid package name "${packageName}" (${reason})`,
    )
  }
}

export async function validatePackageVersion(
  packageName: string,
  packageVersion: string,
) {
  const version = await resolvePackageVersion(packageName, packageVersion)

  // TODO version !== packageVersion
  if (!version) {
    throw new NotFoundException(`Cannot find package ${packageName}`)
  }

  return version
}

export async function validatePackageConfig(
  packageName: string,
  packageVersion: string,
) {
  const packageConfig = await getPackageConfig(packageName, packageVersion)

  if (!packageConfig) {
    throw new NotFoundException(`Cannot get config for package ${packageName}`)
  }
  return packageConfig
}
