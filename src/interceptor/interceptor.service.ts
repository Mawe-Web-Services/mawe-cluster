import { Injectable} from '@nestjs/common';
import { StorageService } from 'src/storage/storage.service';
import { IRedirector } from './interfaces/IRedirect';
import { IConnections } from './interfaces/IConnections';

@Injectable()
export class RedirectInterceptor implements IRedirector {
  private storageService: StorageService;
   connections: IConnections;
  constructor() {
    this.storageService = new StorageService();
    
  }

  public async interceptConnection({serviceId}:{serviceId:string}):Promise<string | boolean> {
    this.connections = await this.storageService.getConnections();
    const relayCount = this.connections.connections.length;
    if(relayCount){
    const index = Math.floor(Math.random() * relayCount);
    const relay = this.connections.connections[index];
    const connection = relay.services.find((service)=> service.service_id === serviceId)?.service_connection || ''
    return connection;
    }

    return '';
   
  }
}
