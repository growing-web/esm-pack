import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { SharedModule } from './modules/shared/shared.module'
import { BuildModule } from './modules/build/build.module'
import { APIModule } from './modules/api/api.module'
import { AppExceptionFilter } from './common/filter'

@Module({
  imports: [SharedModule, BuildModule, APIModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
