# ESM-PACK

## TODO

- [x] 完成 cjs -> esm 构建服务
- [x] 完成 esm 文件查询服务
- [x] Node.js 函数垫片
- [x] 拆分 build 服务和 查询服务，可独立部署(已拆分，但是未独立部署,目前共用一个域名)
- [ ] 完善 exports 字段解析、补全测试，更多实际依赖的单元测试
- [ ] 构建预热（在空闲时间提前构建常用的 npm 包，加速构建服务执行时间）
- [ ] 性能优化，生成 .gz 和 .br 文件，为 cdn 及接口提供加速

## 暂定

- [ ] 私有 npm 源支持

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

## 支持私有源

### 初步想法

- 在 `.env.local` 配置私有源地址，外部公司如果需要支持公司内部源，可以 fork 自行部署在公司内部

```bash

# 稿定内部源
EP_NPM_REGISTRY_URL_GD = https://registry-npm.gaoding.com
# 指定的 scope 走对应的私有源
EP_NPM_REGISTRY_SCOPES_GD = @gaoding,@hlg,@gaodingx

# 其它私有源
EP_NPM_REGISTRY_URL_OTHER =https://xxx
EP_NPM_REGISTRY_SCOPES_OTHER = @xxxx

```

`EP_NPM_REGISTRY_URL_XX`：私有源地址，`XX`在配置文件内不能重复，规定必须以 `EP_NPM_REGISTRY_URL_`开头
`EP_NPM_REGISTRY_SCOPE_XX`：私有源匹配的 scope，`XX`在配置文件内不能重复且跟 URL 的`XX`保持一致，规定必须以 `EP_NPM_REGISTRY_SCOPE_`开头

#### 优先级

如果同时匹配多个 scope，则第一个出现优先级最高，对应配置文件书写最上面优先级最高
