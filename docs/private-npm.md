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
