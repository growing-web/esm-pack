import path from 'path'
import validatePackageName from 'validate-npm-package-name'

export function isJavaScript(pathname: string): boolean {
  const ext = path.extname(pathname).toLowerCase()
  return ext === '.js' || ext === '.mjs' || ext === '.cjs'
}

export function getWebDependencyName(dep: string): string {
  return validatePackageName(dep).validForNewPackages
    ? dep.replace(/\.js$/i, 'js') // if this is a top-level package ending in .js, replace with js (e.g. tippy.js -> tippyjs)
    : dep.replace(/\.m?js$/i, '') // otherwise simply strip the extension (Rollup will resolve it)
}

export function isRemoteUrl(val: string): boolean {
  return /\w+\:\/\//.test(val) || val.startsWith('//')
}

export function isTruthy<T>(item: T | false | null | undefined): item is T {
  return Boolean(item)
}
