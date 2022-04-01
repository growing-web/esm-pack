FROM node:16

MAINTAINER vben

ARG NODE_ENV=production

# 安装目录
ARG APP_INSTALL_PATH=/var/publish/esm-app

ENV NODE_ENV=${NODE_ENV}

RUN mkdir -p ${APP_INSTALL_PATH}

# 定位到容器工作目录
WORKDIR ${APP_INSTALL_PATH}

COPY . ${APP_INSTALL_PATH}

RUN npm i -g pnpm

RUN pnpm run instal

RUN pnpm run build

EXPOSE 6661

CMD ["npm","run","pm2:start"]
