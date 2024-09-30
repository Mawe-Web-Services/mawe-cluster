import { Controller, Post, Body } from '@nestjs/common';
import { StorageService } from './storage.service'; 
import { IRelay, IRelayService } from 'src/interceptor/interfaces/IConnections';
import { IInsertResponse } from 'src/interceptor/interfaces/IInsertResponse';

@Controller() 
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('connection')
  async addRelay(@Body() relay:IRelay): Promise<IInsertResponse> {
      const response = await this.storageService.insertRelay(relay);
      return response
  }

  @Post('service')
  async addService(@Body() body: { imageName: string, repository:string }): Promise<IInsertResponse> {
    const response = await this.storageService.insertService(body);
    return response
  }
}
