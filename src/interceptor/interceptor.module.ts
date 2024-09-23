import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedirectInterceptor } from 'src/interceptor/interceptor.service';
import { RedirectController } from './interceptor.controller';

@Module({
  imports: [HttpModule],
  controllers: [RedirectController],
  providers: [RedirectInterceptor],
})
export class RedirectModule {}
