import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express'
import passport from 'passport'
import helmet from 'helmet'
import compression from 'compression'
import { ConfigService } from './config/config.service'
import { Logger, createSwagger } from './plugins'
import { TransformInterceptor } from './common/interceptor'
import path from 'path'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  )

  app.use(passport.initialize())

  // 可以反向代理
  app.enable('trust proxy')

  app.enableCors({
    origin: (origin, cb) => {
      cb(null, true)
    },
    credentials: true,
  })

  // Web漏洞的
  app.use(helmet())
  app.use(compression())

  const configService = app.get(ConfigService)
  const { appPort, apiPrefix } = configService

  // 设置全局接口前缀
  app.setGlobalPrefix(apiPrefix)

  app.useStaticAssets(path.join(__dirname, '..', 'public'), {
    prefix: '/api/',
  })

  // 打印请求日志
  // app.use(loggerMiddleware);

  // 使用全局拦截器
  //   app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalInterceptors(
    //   new LoggerInterceptor(reflector),
    new TransformInterceptor(),
  )

  const swaggerServer = createSwagger(app)

  await app.listen(appPort, () => {
    Logger.info(
      `服务已经启动,访问地址：http://localhost:${appPort}${apiPrefix}`,
    )
    swaggerServer()
  })
}
bootstrap()