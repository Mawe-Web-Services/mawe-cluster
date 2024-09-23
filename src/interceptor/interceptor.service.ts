import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class RedirectInterceptor implements NestInterceptor {
  constructor(private readonly httpService: HttpService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const originalUrl = request.url;

    if (originalUrl.includes('/intercept')) {
      const newUrl = 'http://localhost:3003/';

      return this.httpService.post(newUrl, request.body)
        .pipe(
          map(response => {
            return response.data;
          }),
        );
    }

    return next.handle();
  }
}
