const PACKAGE_RE = /^((?:@[^/\\%@]+\/)?[^./\\%@][^/\\%@]*)@?([^\\/]+)?(\/.*)?$/

export function parsePackagePathname(pathname: string) {
  try {
    pathname = decodeURIComponent(pathname)
  } catch (error) {
    return null
  }

  const match = pathname.match(PACKAGE_RE)
  if (match === null) {
    return null
  }

  const packageName = match[1]
  const packageVersion = match[2]

  return {
    packageName,
    packageVersion,
  }
}
