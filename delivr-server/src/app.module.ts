import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { SharedModule } from './modules/shared/shared.module'
import { NpmModule } from './modules/npm/npm.module'
import { APIModule } from './modules/api/api.module'
import { AppExceptionFilter } from './common/filter'

@Module({
  imports: [SharedModule, NpmModule, APIModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
