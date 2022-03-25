import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
// import { classToPlain } from 'class-transformer';
// import { Request } from 'express';
import { ResponseWrapper } from '../../utils/response'

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const request = context.switchToHttp().getRequest() as Request;
    return next.handle().pipe(
      map((data) => {
        // const plainData = classToPlain(data);

        //  枚举转文本
        // if (request.method.toUpperCase() === 'GET') {
        //     plainData = this.transformEnumToText(plainData);
        // }
        return ResponseWrapper.success(data)
      }),
    )
  }
}
