import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RedirectInterceptor } from 'src/interceptor/interceptor.service';
import { RedirectController } from './interceptor.controller';
import { RemoteService } from 'src/remote/remote.service';

@Module({
  imports: [HttpModule, RemoteService],
  controllers: [RedirectController],
  providers: [RedirectInterceptor],
})
export class RedirectModule {}
