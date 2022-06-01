#!/bin/bash
set -eux

# 默认环境变量
export NODE_ENV=${NODE_ENV-}


# 全局变量
# TODO: 这里修改成实际的项目应用列表，应用名使用空格隔开
declare -a appArr=(api delivr)

declare -a appInstallPath=${APP_INSTALL_PATH-"./"}

if [ ! -d "${appInstallPath}" ]; then
  echo "appInstallPath does not exist." > /dev/stderr
  exit 1
fi

#######################################
# 验证应用
# 参数列表：
#   $1: app - 应用名称
#######################################
validateApp(){
  local app="$1"

  for v in "${appArr[@]}"
  do
    if [[ "${v}" == "${app}" ]]; then
      return 0
    fi
  done

  error "app=${app} is invalid, appArr=(${appArr[*]})."
  return 1
}

#######################################
# 安装应用
# 参数列表：
#   $1: app - 应用名称
#######################################
install(){
  local app="$1"
  cd "${appInstallPath}"
  yarn install:deps:all
}

#######################################
# 启动应用
# 参数列表：
#   $1: app - 应用名称
#######################################
start(){
  local app="$1"
  cd "${appInstallPath}"
  yarn start:${app}
}

#######################################
# PM2启动应用
# 参数列表：
#   $1: app - 应用名称
#######################################
start_pm2(){
  local app="$1"
  cd "${appInstallPath}"
  npm run start:${app}
}

#######################################
# 终止应用
# 参数列表：
#   $1: app - 应用名称
#######################################
stop(){
  local app="$1"
  cd "${appInstallPath}"
  yarn stop:${app}
}

#######################################
# 终止应用
# 参数列表：
#   $1: app - 应用名称
#######################################
stop_pm2(){
  local app="$1"
  cd "${appInstallPath}"
  yarn stop_pm2:${app}
}

#######################################
# 健康检查应用
# 参数列表：
#   $1: app - 应用名称
#######################################
healthcheck(){
  local app="$1"
  echo "app=${app} always healthy"

}

#######################################
# 输出错误
# 参数列表：
#   $1: message - 错误消息
#######################################
error(){
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $*" >&2
}

#######################################
# 主函数
# 参数列表：
#   $1: opcode - 操作码（install start stop healthcheck）
#   $2: app - 应用名称
#######################################
main(){
  local opcode="$1"
  local app="$2"

  validateApp "$app"

  case "$opcode" in
    install)
      install "$app"
      ;;
    start)
      start_pm2 "$app"
      ;;
    stop)
      stop_pm2 "$app"
      ;;
    healthcheck)
      healthcheck "$app"
      ;;
    *)
      error "opcode=${opcode} is invalid."
      exit 1
      ;;
  esac
}

#######################################
# 执行流程
#######################################
tree -L 2
main "$@"
