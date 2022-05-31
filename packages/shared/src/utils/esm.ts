import { init, parse } from 'es-module-lexer'
export async function isEsmFile(content: string) {
  await init
  try {
    const [imports, exp] = parse(content)
    return exp.length > 0 || imports.length > 0
  } catch (error) {
    return false
  }
}
