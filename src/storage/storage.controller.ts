import { Controller, Post, Body } from '@nestjs/common';
import { StorageService } from './storage.service'; 
import { IRelay } from 'src/interceptor/interfaces/IConnections';
import { IInsertRelayResponse } from 'src/interceptor/interfaces/IInsertRelayResponse';

@Controller() 
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('connection')
  async addRelay(@Body() relay:IRelay): Promise<IInsertRelayResponse> {
      const response = await this.storageService.insertRelay(relay);
      return response
  }
}
