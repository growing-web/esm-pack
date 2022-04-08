import _ from 'lodash'

/**
 *  Recursively delete fields with value .d.ts.
 * @param exp
 * @returns
 */
export function recursionExportsRemoveDts(
  exp: Record<string, any>,
): Record<string, any> {
  const resultExports: Record<string, any> = {}

  for (const [key, value] of Object.entries(exp)) {
    if (_.isString(value)) {
      if (!value.endsWith('d.ts')) {
        resultExports[key] = value
      }
    } else if (_.isObject(value)) {
      resultExports[key] = recursionExportsRemoveDts(value)
    }
  }
  return resultExports
}

/**
 * get filename recursively
 * @param exp
 * @returns
 */
export function recursionExportsValues(exp: Record<string, any>) {
  const files: string[] = []
  for (const value of Object.values(exp)) {
    if (_.isString(value)) {
      if (!value.endsWith('d.ts')) {
        files.push(value)
      }
    } else if (_.isObject(value)) {
      files.push(...recursionExportsValues(value))
    }
  }
  return Array.from(new Set(files))
}
