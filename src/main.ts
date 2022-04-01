import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express'
import helmet from 'helmet'
import compression from 'compression'
import { ConfigService } from './config/config.service'
import { Logger } from './plugins'
// import path from 'path'
import morgan from 'morgan'
import { isDev } from './utils/env'
process.setMaxListeners(0)
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  )

  app.disable('x-powered-by')
  app.enable('trust proxy')
  app.enable('strict routing')

  if (isDev) {
    app.use(morgan('dev'))
  }

  app.enableCors({
    origin: (origin, cb) => {
      cb(null, true)
    },
    credentials: true,
  })

  app.use(helmet())
  app.use(compression())

  const configService = app.get(ConfigService)
  const { appPort, apiPrefix } = configService

  // 设置全局接口前缀
  app.setGlobalPrefix(apiPrefix)

  //   app.useStaticAssets(path.join(__dirname, '..', 'public'), {
  //     maxAge: '1y',
  //   })

  // 打印请求日志
  // app.use(loggerMiddleware);

  // 使用全局拦截器
  //   app.useGlobalFilters(new AppExceptionFilter());
  //   app.useGlobalInterceptors(
  //     //   new LoggerInterceptor(reflector),
  //     new TransformInterceptor(),
  //   )

  await app.listen(appPort, () => {
    Logger.info(
      `The service has been started：http://localhost:${appPort}${apiPrefix}`,
    )
  })
}
bootstrap()
