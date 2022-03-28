import { MiddlewareConsumer, Module } from '@nestjs/common'
import { NpmController } from './npm.controller'
import { NpmService } from './npm.service'
import { NoQueryMiddleware } from '../../common/middleware'

@Module({
  controllers: [NpmController],
  providers: [NpmService],
})
export class NpmModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(NoQueryMiddleware).forRoutes('npm/*')
  }
}
