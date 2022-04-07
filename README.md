# ESM-PACK

## TODO

- [x] 完成 cjs -> esm 构建服务
- [x] 完成 esm 文件查询服务
- [x] Node.js 函数垫片
- [ ] 文档
- [ ] 私有 npm 源支持
- [ ] 拆分 build 服务和 查询服务，可独立部署(已拆分，但是未独立部署)
- [ ] 构建预热（在空闲时间提前构建常用的 npm 包，加速构建服务执行时间）
- [ ] 性能优化，生成 .gz 和 .br 文件，为 cdn 及接口提供加速

## 安装

```json
pnpm install
```

## 运行

```json
cd packages/server
pnpm run dev
```

# 接口说明

## npm 版本最新请求接口

### 格式

```bash
{{url}}/npm/{package}@{version}
```

### 示例

```bash
# 返回 vue2.0 版本最新版本号
{{url}}/npm/vue@2

# 返回 vue2.5 版本最新版本号
{{url}}/npm/vue@2.5
```

## 包构建接口

### 格式

```bash
{{url}}/build/{package}@{version}
```

### 示例

```bash
# 构建vue 2.6.14版本为esm
{{url}}/npm/vue@2.6.14
```

## 访问 esm 包接口

### 格式

```bash
{{url}}/esm/{package}@{version}
```

### 示例

```bash
{{url}}/esm/vue@2.6.14/pacakge.json
{{url}}/esm/vue@2.6.14/index.js
```
