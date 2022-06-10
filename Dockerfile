FROM registry-vpc.cn-hangzhou.aliyuncs.com/gaodingx/docker-base-images:node-16-onbuild-ubuntu
# FROM node:16

MAINTAINER vben

ARG NODE_ENV=production



RUN set -ex \
  && sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
  && echo "${TIME_ZONE}" > /etc/timezone \
  && ln -sf /usr/share/zoneinfo/${TIME_ZONE} /etc/localtime \
  && apk add --no-cache tzdata curl coreutils tree bash \
  && apk add python libc-dev gcc g++ make \
  && apk add git

RUN set -ex \
  && npm config set registry https://registry.npm.taobao.org/ \
  && npm install pnpm


# 安装目录
ARG APP_INSTALL_PATH=/usr/apps/esmpack-api-server

ENV NODE_ENV=${NODE_ENV}

RUN mkdir -p ${APP_INSTALL_PATH}

# 定位到容器工作目录
COPY . ${APP_INSTALL_PATH}

WORKDIR ${APP_INSTALL_PATH}

RUN npm i -g pnpm --registry=https://registry.npmmirror.com

RUN pnpm install

EXPOSE 6123

CMD ['pnpm','run','build']
# CMD ["npm","run","start-api"]
CMD [ "./docker-entrypoint.sh", "start_pm2", "api" ]

HEALTHCHECK  --start-period=60s --interval=15s --timeout=1s --retries=3 \
  CMD curl -f http://localhost:6123/health
