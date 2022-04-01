function _e(name) {
  throw new Error(`[esm] fs: '${name}' is not implemented`)
}

export const F_OK = null
export const R_OK = null
export const W_OK = null
export const X_OK = null

export const access = () => _e('accessaccess')
export const accessSync = () => _e('accessSyncaccessSync')
export const appendFile = () => _e('appendFile')
export const appendFileSync = () => _e('appendFileSync')
export const chmod = () => _e('chmod')
export const chmodSync = () => _e('chmodSync')
export const chown = () => _e('chown')
export const chownSync = () => _e('chownSync')
export const close = () => _e('close')
export const closeSync = () => _e('closeSync')
export const constants = new Proxy({}, { get: () => null })
export const copyFile = () => _e('copyFile')
export const copyFileSync = () => _e('copyFileSync')
export const Dir = () => _e('Dir')
export const Dirent = () => _e('Dirent')
export const exists = () => _e('exists')
export const existsSync = () => _e('existsSync')
export const fdatasync = () => _e('fdatasync')
export const fdatasyncSync = () => _e('fdatasyncSync')
export const fstat = () => _e('fstat')
export const fstatSync = () => _e('fstatSync')
export const fsync = () => _e('fsync')
export const fsyncSync = () => _e('fsyncSync')
export const ftruncate = () => _e('ftruncate')
export const ftruncateSync = () => _e('ftruncateSync')
export const futimes = () => _e('futimes')
export const futimesSync = () => _e('futimesSync')
export const link = () => _e('link')
export const linkSync = () => _e('linkSync')
export const lstat = () => _e('lstat')
export const lstatSync = () => _e('lstatSync')
export const mkdir = () => _e('mkdir')
export const mkdirSync = () => _e('mkdirSync')
export const mkdtemp = () => _e('mkdtemp')
export const mkdtempSync = () => _e('mkdtempSync')
export const open = () => _e('open')
export const openSync = () => _e('openSync')
export const read = () => _e('read')
export const readSync = () => _e('readSync')
export const promises = new Proxy({}, { get: (name) => _e(`promises/${name}`) })
export const readdir = () => _e('readdir')
export const readdirSync = () => _e('readdirSync')
export const readFile = () => _e('readFile')
export const readFileSync = () => _e('readFileSync')
export const readlink = () => _e('readlink')
export const readlinkSync = () => _e('readlinkSync')
export const realpath = () => _e('realpath')
export const realpathSync = () => _e('realpathSync')
export const rename = () => _e('rename')
export const renameSync = () => _e('renameSync')
export const rmdir = () => _e('rmdir')
export const rmdirSync = () => _e('rmdirSync')
export const rm = () => _e('rm')
export const rmSync = () => _e('rmSync')
export const stat = () => _e('stat')
export const Stats = () => _e('Stats')
export const statSync = () => _e('statSync')
export const symlink = () => _e('symlink')
export const symlinkSync = () => _e('symlinkSync')
export const truncate = () => _e('truncate')
export const truncateSync = () => _e('truncateSync')
export const unlink = () => _e('unlink')
export const unlinkSync = () => _e('unlinkSync')
export const utimes = () => _e('utimes')
export const utimesSync = () => _e('utimesSync')
export const watch = () => _e('watch')
export const watchFile = () => _e('watchFile')
export const write = () => _e('write')
export const writeSync = () => _e('writeSync')
export const writeFile = () => _e('writeFile')
export const writeFileSync = () => _e('writeFileSync')

export default {
  access,
  accessSync,
  appendFile,
  appendFileSync,
  chmod,
  chmodSync,
  chown,
  chownSync,
  close,
  closeSync,
  constants,
  copyFile,
  copyFileSync,
  Dir,
  Dirent,
  exists,
  existsSync,
  F_OK,
  fdatasync,
  fdatasyncSync,
  fstat,
  fstatSync,
  fsync,
  fsyncSync,
  ftruncate,
  ftruncateSync,
  futimes,
  futimesSync,
  link,
  linkSync,
  lstat,
  lstatSync,
  mkdir,
  mkdirSync,
  mkdtemp,
  mkdtempSync,
  open,
  openSync,
  promises,
  R_OK,
  read,
  readdir,
  readdirSync,
  readFile,
  readFileSync,
  readlink,
  readlinkSync,
  readSync,
  realpath,
  realpathSync,
  rename,
  renameSync,
  rm,
  rmdir,
  rmdirSync,
  rmSync,
  stat,
  Stats,
  statSync,
  symlink,
  symlinkSync,
  truncate,
  truncateSync,
  unlink,
  unlinkSync,
  utimes,
  utimesSync,
  W_OK,
  watch,
  watchFile,
  write,
  writeFile,
  writeFileSync,
  writeSync,
  X_OK,
}
