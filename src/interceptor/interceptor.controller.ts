import { Controller, Redirect, Query, All } from '@nestjs/common';

@Controller('redirect')
export class RedirectController {
  @All('mawe')
  @Redirect()
  handleAll(@Query('target') target: string) {
    const url = target ? `http://localhost:3003/` : 'http://localhost:3000/';
    return { url, statusCode: 302 };
  }
}