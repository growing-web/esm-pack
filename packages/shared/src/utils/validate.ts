import validatePackageName from 'validate-npm-package-name'

export async function validateNpmPackageName(packageName: string) {
  const errors = validatePackageName(packageName).errors

  if (errors) {
    const reason = errors.join(', ')

    return reason
  }

  return null
}
