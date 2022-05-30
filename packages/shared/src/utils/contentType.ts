import path from 'node:path'
import mime from 'mime'

mime.define(
  {
    'text/plain': [
      'authors',
      'changes',
      'license',
      'makefile',
      'patents',
      'readme',
      'ts',
      'flow',
    ],
  },
  true,
)

const textFiles = /\/?(\.[a-z]*rc|\.git[a-z]*|\.[a-z]*ignore|\.lock)$/i

export function getContentType(file: string) {
  const name = path.basename(file, '.br')

  const type = textFiles.test(name)
    ? 'text/plain'
    : mime.getType(name) || 'text/plain'

  return type === 'application/javascript' ? type + '; charset=utf-8' : type
}
