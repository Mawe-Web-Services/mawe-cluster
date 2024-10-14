import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { RedirectInterceptor } from 'src/interceptor/interceptor.service';

@Module({
  imports: [],
  controllers: [StorageController],
  providers: [StorageService, RedirectInterceptor],
})
export class StorageModule {}
