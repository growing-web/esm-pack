# CDN Server

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
