# CommonJS 兼容性

## CommonJS 判断标准

任何不是 ECMAScript 模块的模块都被视为 CommonJS，评定是否为 ECMAScript 以的标准有以下：

- .mjs 结尾的文件。
- package.json 内明确设置  “type”: “module”时，所有的 .js 文件。
- .js 文件内部使用 import、export 语法

## CommonJS 转换规则

转换过程提供了以下 CommonJS 兼容性特性：

- 所有 CommonJS 模块通过 RollupJS 被有效地转换为标准的 ECMAScript 模块：

```js
// module.exports cjs 会被转化为：
export default cjs

// const cjs = require('cjs') 会被转化为：
import cjs from 'cjs'
```

- 使用 [rollup-plugin-polyfill-node](https://github.com/FredKSchott/rollup-plugin-polyfill-node) 对 `process`、`buffer` 等 Node.js 库进行填充。
- 对 `global` 的任何引用都将重写为实际环境 `global`（`globalThis`）。
- `__filename` 和 `__dirname` 引用使用 `URL('.', import.meta.url)` 进行重写。
- 基于 [CJS Module Lexer](https://github.com/guybedford/cjs-module-lexer) 检测 CommonJS 模块的命名导出。使用静态分析方法来确定 CommonJS 模块的命名导出。默认导出将始终保留为 `module.exports` 实例。
- 使用严格模式进行 CommonJS 转换。
- 不支持动态 `require` 和 `require.resolve`（后续 `import.meta.resolve` 代替）重写。
