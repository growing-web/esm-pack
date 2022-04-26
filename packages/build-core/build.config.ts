import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  entries: ['src/index'],
  declaration: true,
  rollup: {
    cjsBridge: true,
    emitCJS: true,
  },
  externals: ['resolve'],
})