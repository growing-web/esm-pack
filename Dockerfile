FROM registry-vpc.cn-hangzhou.aliyuncs.com/gaodingx/docker-base-images:node-16-onbuild-ubuntu

MAINTAINER vben

ARG NODE_ENV=production

# 安装目录
ARG APP_INSTALL_PATH=/usr/apps/esmpack-api-server

ENV NODE_ENV=${NODE_ENV}

RUN mkdir -p ${APP_INSTALL_PATH}

# 定位到容器工作目录
WORKDIR ${APP_INSTALL_PATH}

COPY . ${APP_INSTALL_PATH}

RUN npm i -g pnpm --registry=https://registry.npmmirror.com

RUN pnpm install

EXPOSE 6123

CMD ['pnpm','run','build']
# CMD ["npm","run","start-api"]
# CMD [ "./docker-entrypoint.sh", "start_pm2", "api" ]

HEALTHCHECK  --start-period=60s --interval=15s --timeout=1s --retries=3 \
  CMD curl -f http://localhost:6123/health
