import path from 'path'
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

export default function getContentType(file) {
  const name = path.basename(file)

  return textFiles.test(name)
    ? 'text/plain'
    : // @ts-ignore
      mime.getType(name) || 'text/plain'
}
