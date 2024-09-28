import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedirectInterceptor } from 'src/interceptor/interceptor.service';
import { RedirectModule } from './interceptor/interceptor.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [HttpModule, RedirectModule, StorageModule],
  controllers: [AppController],
  providers: [AppService,  {
    provide: 'APP_INTERCEPTOR',
    useClass: RedirectInterceptor,
  }],
})
export class AppModule {}
