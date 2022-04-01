import { MiddlewareConsumer, Module } from '@nestjs/common'
import { EsmController } from './esm.controller'
import { EsmService } from './esm.service'
import { NoQueryMiddleware } from '../../common/middleware'

@Module({
  controllers: [EsmController],
  providers: [EsmService],
})
export class EsmModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(NoQueryMiddleware).forRoutes('esm/*')
  }
}
