FROM registry-vpc.cn-hangzhou.aliyuncs.com/gaodingx/docker-base-images:node-16-onbuild-ubuntu
# FROM node:16

MAINTAINER vben

ARG NODE_ENV=production

RUN apt-get update && apt-get install tree -y

RUN npm install pnpm turbo -g
RUN npm install pnpm unbuild -g


# 安装目录
ARG APP_INSTALL_PATH=/esmpack-app

ENV NODE_ENV=${NODE_ENV}

RUN mkdir -p ${APP_INSTALL_PATH}

# 定位到容器工作目录
COPY . ${APP_INSTALL_PATH}

WORKDIR ${APP_INSTALL_PATH}

RUN pnpm fetch

RUN pnpm install

RUN pnpm run build

EXPOSE 80

# CMD ['pnpm','run','build']
# CMD ["npm","run","start-api"]
CMD [ "./docker-entrypoint.sh", "start_pm2", "api" ]

HEALTHCHECK  --start-period=60s --interval=15s --timeout=1s --retries=3 \
  CMD curl -f http://localhost/health
