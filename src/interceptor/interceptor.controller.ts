import { Controller, Redirect, Query, All } from '@nestjs/common';
import { RedirectInterceptor } from './interceptor.service';

@Controller()
export class RedirectController {
  @All()
  @Redirect()
  async handleAll(@Query() query: Record<string, any>) {
    const redirectService = new RedirectInterceptor();
    const queryString = new URLSearchParams(query).toString();
    const connection = await redirectService.interceptConnection({serviceId:query.service_id});
    const url =`${connection}?${queryString}`;
    return { url, statusCode: 302 };
  }
}