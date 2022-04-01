FROM registry.cn-hangzhou.aliyuncs.com/gaodingx/docker-base-images:node-16-onbuild

ARG NODE_ENV=production

# 安装目录
ARG APP_INSTALL_PATH=/usr/src/esm-app

ENV NODE_ENV=${NODE_ENV}

# 定位到容器工作目录
WORKDIR ${APP_INSTALL_PATH}
