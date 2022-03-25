import { INestApplication } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '../../config/config.service'
import { Logger } from '../logger'

// 配置Swagger api文档信息
export const createSwagger = (app: INestApplication) => {
  let logFn = () => {}
  const configService = app.get(ConfigService)

  const {
    apiPrefix,
    appPort,
    swaggerDesc,
    swaggerEnable,
    swaggerTitle,
    swaggerUrl,
    swaggerVersion,
  } = configService

  if (!swaggerEnable) {
    return logFn
  }

  const options = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDesc)
    .setVersion(swaggerVersion)
    .addBearerAuth({ type: 'apiKey', in: 'header', name: 'Authorization' })
    .build()
  const document = SwaggerModule.createDocument(app, options)
  SwaggerModule.setup(`${apiPrefix}/${swaggerUrl}`, app, document)

  logFn = () => {
    Logger.info(
      `swagger接口文档访问地址:http://localhost:${appPort}/${apiPrefix}/${swaggerUrl}`,
    )
  }
  return logFn
}
