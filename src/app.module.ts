import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { SharedModule } from './modules/shared/shared.module'
import { BuildModule } from './modules/build/build.module'
import { NpmModule } from './modules/npm/npm.module'
import { APIModule } from './modules/api/api.module'
// import { EsmModule } from './modules/esm/esm.module'
import { AppExceptionFilter } from './common/filter'

@Module({
  imports: [
    SharedModule,
    BuildModule,
    NpmModule,
    APIModule,
    // EsmModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
