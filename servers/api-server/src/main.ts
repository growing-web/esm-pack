import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express'
import helmet from 'helmet'
// import compression from 'compression'
import { ConfigService } from './config/config.service'
import { Logger } from './plugins'
import { isDev } from './utils/env'
import morgan from 'morgan'

async function bootstrap() {
  //   process.setMaxListeners(0)
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
    // credentials: true,
  })

  app.use(helmet())
  //   app.use(compression())

  const configService = app.get(ConfigService)
  const { appPort, apiPrefix } = configService

  app.setGlobalPrefix(apiPrefix)

  await app.listen(appPort, () => {
    Logger.info(
      `Application is running on：http://localhost:${appPort}${apiPrefix}`,
    )
  })
}
bootstrap()
