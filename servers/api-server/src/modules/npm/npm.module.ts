import { MiddlewareConsumer, Module } from '@nestjs/common'
import { NpmController } from './npm.controller'
import { NpmService } from './npm.service'
import { NoQueryMiddleware } from '../../common/middleware'
import { EsmModule } from '@/modules/esm/esm.module'

@Module({
  imports: [EsmModule],
  controllers: [NpmController],
  providers: [NpmService],
  exports: [],
})
export class NpmModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(NoQueryMiddleware).forRoutes('npm/*')
  }
}
