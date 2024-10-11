import { Injectable} from '@nestjs/common';
import { StorageService } from 'src/storage/storage.service';
import { IRedirector } from './interfaces/IRedirect';
import { IConnections } from './interfaces/IConnections';
import { ServiceStatus } from 'src/core/enum/ServiceStatus';

@Injectable()
export class RedirectInterceptor implements IRedirector {
  private storageService: StorageService;
   connections: IConnections;
  constructor() {
    this.storageService = new StorageService();
    
  }

  public async interceptConnection({serviceId}: {serviceId: string}): Promise<Array<string> | boolean> {
    this.connections = await this.storageService.getConnections();
    const relayCount = this.connections?.connections?.length;
    if (relayCount > 0) { 
      
        const runningConnections = this.connections.connections
            .flatMap((relay) => relay.services)
            .filter((service) => service.service_id === serviceId && service.status === ServiceStatus.RUNNING)
            .map((service) => service.service_connection);
        
        if (runningConnections.length > 0) {
            return runningConnections;
        }
    }

    return false;
  }

  public async fetchFastestRelay({ 
    responserURL, 
    serviceId }: { 
    responserURL: string, 
    serviceId: string}) {
    this.connections = await this.storageService.getConnections();
    const relays = this.connections.connections;
    const baseUrl = responserURL.split('.lt')[0] + '.lt';
  
    const fastestRelay = relays.find((relay) =>
      relay.services.some((service) => service.service_connection === baseUrl)
    );
  
    const relayId = fastestRelay ? fastestRelay.id : null;
  
    await this.storageService.registerService({relayId: relayId, serviceId:serviceId});
  }

  public async activateService({serviceId, isRecall = false}:{serviceId:string, isRecall?:boolean}):Promise<void> {
    if(!isRecall) {
    await this.storageService.changeServiceStatus({serviceId: serviceId, status: ServiceStatus.RUNNING});
    // ativar o serviço nos respectivos relays enviando um comando para tal
    }
    const today = new Date().getTime();
    const minimumHibernateTimeInSecounds = 25*60; 
    const maximumHibernateTimeInSecounds = 30*60;
    const msFactor = 1000;
    this.connections = await this.storageService.getConnections();
    const lastRequest = this.connections.services.find((service)=> service.service_id === serviceId).last_request;
    const lastRequestTimeStamp = new Date(lastRequest).getTime();
    const lastRequestTimeDiffInSecounds = (today - lastRequestTimeStamp)/msFactor;
    const isValidHibernateTime = Boolean(lastRequestTimeDiffInSecounds >= minimumHibernateTimeInSecounds);

    if(isValidHibernateTime){
      await this.storageService.updateRequestTime({serviceId: serviceId, status: ServiceStatus.HIBERNATING});
      // derrubar o serviço nos respectivos relays enviando um comando para tal
      return;
    }

    if(!isRecall){
      setTimeout(async ()=>{
        await this.activateService({serviceId: serviceId, isRecall:true});
      },maximumHibernateTimeInSecounds*msFactor);

    await this.storageService.updateRequestTime({serviceId: serviceId, status: ServiceStatus.RUNNING});
    }
    return;
  }
}
