import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { SharedModule } from './modules/shared/shared.module'
// import { AuthModule } from './modules/auth/auth.module'
import { BuildModule } from './modules/build/build.module'
import { NpmModule } from './modules/npm/npm.module'
import { AppExceptionFilter } from './common/filter'
// import { LoggerInterceptor } from './common/interceptor'

@Module({
  imports: [SharedModule, BuildModule, NpmModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: LoggerInterceptor,
    // },
  ],
})
export class AppModule {}
