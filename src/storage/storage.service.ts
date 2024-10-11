import * as fs from 'fs';
import * as path from 'path';
import { HttpMethod } from 'src/core/enum/HttpMethod';
import { IConnections, IRelay, IRelayService } from 'src/interceptor/interfaces/IConnections';
import { RemoteService } from 'src/remote/remote.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { IInsertResponse } from 'src/interceptor/interfaces/IInsertResponse';
import { IReturn } from 'src/core/interfaces/IReturn';
import { ServiceStatus } from 'src/core/enum/ServiceStatus';

export class StorageService {
  private remoteService:RemoteService;
  private distFilePath: string;
  private srcFilePath: string;
  private isWriting: boolean = false; 
  private queue: (() => Promise<IInsertResponse>)[] = [];
  private dificulty:number;
  private limitRequestTime: number;

  constructor() {
    this.distFilePath = path.join(__dirname, 'data', 'connections.json');
    this.srcFilePath = path.join(__dirname, 'data', 'connections.json').replace('dist', 'src');
    this.remoteService = new RemoteService();
    this.dificulty = 4;
    this.limitRequestTime = 60000;
  }

  public async getConnections(): Promise<IConnections> {
    try {
      if (!fs.existsSync(this.srcFilePath)) {
        throw new Error(`O arquivo ${this.srcFilePath} não foi encontrado.`);
      }

      const data = await fs.promises.readFile(this.srcFilePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao buscar os dados:', error.message);
      throw error;
    }
  }

  private async processQueue() {
    while (this.queue.length > 0) {
      const nextTask = this.queue.shift();
      if (nextTask) {
        await nextTask(); 
      }
    }
    this.isWriting = false; 
  }

  private generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }


  public async relayTest(connect: IRelay): Promise<boolean> {
    const minerRote = '/miner';
    const body = {
      query: uuidv4(),
      dificulty:this.dificulty
    };
   const response = await this.remoteService.remote<{hash: string; nonce: number}>({
    method: HttpMethod.POST, 
    endpoint:`${connect.relay_connection}${minerRote}`, 
    authorization: connect.id, // deve ser usado o authorization específico do relay
    body: body,
    timeout:this.limitRequestTime
  });

  if(response.result){
  const nonce = response.result.nonce;
  const relayHash = response.result.hash;
  const query = body.query + nonce;
  const clusterHash = this.generateHash(query);
  const isValidHash = Boolean(clusterHash === relayHash);
  return isValidHash
  }
  return false;
  }

  private async deployService({connect,imageName, repository}:{connect: IRelay, imageName: string, repository:string}): Promise<IReturn<{ tunnelUrl: string; applicationId: string; }>> {
    const deployRote = '/docker/deploy';
    const body = {
      imageName: imageName,
      repository:repository
    }
   const response = await this.remoteService.remote<{tunnelUrl:string, applicationId:string}>({
    method: HttpMethod.POST, 
    endpoint:`${connect.relay_connection}${deployRote}`, 
    authorization: connect.id, // deve ser usado o authorization específico do relay
    body: body,
    timeout:this.limitRequestTime
  });

   return response
  }


  public async insertRelay(newConnection: IRelay): Promise<IInsertResponse> {
    return new Promise((resolve) => {
      const task = async (): Promise<IInsertResponse> => {

        const response = await this.relayTest(newConnection);

        if(!response){
          resolve({ status: 'ERROR', code: 500, message:'limit request time' });
          return { status: 'ERROR', code: 500, message: 'limit request time'}; 
        }
        try {
          const connections = await this.getConnections();
          connections.connections.push(newConnection);

          await fs.promises.writeFile(this.srcFilePath, JSON.stringify(connections, null, 2), 'utf-8');
          await fs.promises.writeFile(this.distFilePath, JSON.stringify(connections, null, 2), 'utf-8');

          resolve({ status: 'SUCCESS', code: 200 });
          return { status: 'SUCCESS', code: 200 }; 
        } catch (error) {
          console.error('Erro ao adicionar nova conexão:', error.message);
          resolve({ status: 'ERROR', code: 401, message: error.message });
          return { status: 'ERROR', code: 401, message: error.message }; 
        }
      };

      this.queue.push(task);

      if (!this.isWriting) {
        this.isWriting = true;
        this.processQueue();
      }
    });
  }

  public async insertService({imageName, repository}:{imageName: string,repository:string}): Promise<IInsertResponse> {
    return new Promise((resolve) => {
      const task = async (): Promise<IInsertResponse> => {
        try {
          const newServiceId = uuidv4();
          this.isWriting = true;

          const connections = await this.getConnections();

          if(!Boolean(connections.connections.length)){
            resolve({ status: 'ERROR', code: 500, message: 'No connections' });
            return { status: 'ERROR', code: 500, message: 'No connections' };
          }
       
          
          const relayToRemove = [];
          for(let i = 0; i< connections.connections.length; i++) {
            const relayTestResponse = await this.relayTest(connections.connections[i]);
            if(!relayTestResponse){
              relayToRemove.push(connections.connections[i].id);
            }            
          }

          connections.connections = connections.connections.filter((connection)=> !relayToRemove.includes(connection.id));

          if(!Boolean(connections.connections.length)){
            resolve({ status: 'ERROR', code: 404, message: 'no relays available'});
            return { status: 'ERROR', code: 404,  message: 'no relays available' };
          }
          const today = new Date();
          for(let k = 0; k < connections.connections.length; k++){
            const relay = connections.connections[k];
            
            const response = await this.deployService({
              connect:relay, 
              imageName:imageName, 
              repository:repository
            });

            if(response.result.applicationId){

              
              const apiService = response.result;

              const serviceBody: IRelayService = {
                service_id: newServiceId,
                createdAt: today,
                service_connection: apiService.tunnelUrl,
                request_count:0,
                status: ServiceStatus.HIBERNATING
                
              };
              connections.connections[k].services.push(serviceBody);
            }   
          }
          const verifyServiceOnRelay = connections.connections?.some(
            (connection) => connection.services?.some(
              (service) => service.service_id === newServiceId
            )
          );

          if(verifyServiceOnRelay){
            const newService = {
              service_id: newServiceId,
              createdAt: today,
            }
            connections.services.push(newService);
          };
        

          await fs.promises.writeFile(this.srcFilePath, JSON.stringify(connections, null, 2), 'utf-8');
          await fs.promises.writeFile(this.distFilePath, JSON.stringify(connections, null, 2), 'utf-8');

          resolve({ status: 'SUCCESS', code: 200, serviceId: newServiceId });
          return { status: 'SUCCESS', code: 200, serviceId: newServiceId };
        } catch (error) {
          console.error('Erro ao adicionar novo serviço:', error.message);
          resolve({ status: 'ERROR', code: 401, message: error.message });
          return { status: 'ERROR', code: 401, message: error.message };
        } finally {
          this.isWriting = false;
        }
      };

      this.queue.push(task);

      if (!this.isWriting) {
        this.isWriting = true;
        this.processQueue();
      }
    });
  }

  public async registerService({ relayId, serviceId }: { relayId: string, serviceId: string }): Promise<void> {
    try {
      const connections = await this.getConnections();
  
      const relay = connections.connections.find((connection) => connection.id === relayId);
      
      if (!relay) {
        throw new Error(`Relay with ID ${relayId} not found`);
      }
  
      const service = relay.services.find((service) => service.service_id === serviceId);
  
      if (!service) {
        throw new Error(`Service with ID ${serviceId} not found in relay ${relayId}`);
      }

      service.request_count = (service.request_count || 0) + 1;
  
      await fs.promises.writeFile(this.srcFilePath, JSON.stringify(connections, null, 2), 'utf-8');
      await fs.promises.writeFile(this.distFilePath, JSON.stringify(connections, null, 2), 'utf-8');
  
    } catch (error) {
      console.error('Erro ao registrar serviço:', error.message);
    }
  }

  public async updateRequestTime({  serviceId, status }: { serviceId: string , status:ServiceStatus}): Promise<void> {
    try {
      const today = new Date();
      const connections = await this.getConnections();
  
      const service = connections.services.find((service) => service.service_id === serviceId);
  
      if (!service) {
        throw new Error(`Service with ID ${serviceId} not found`);
      }

      service.last_request = today;
      connections.connections.map((relay) => relay.services.find((service) => service.service_id === serviceId).status = status);
  
      await fs.promises.writeFile(this.srcFilePath, JSON.stringify(connections, null, 2), 'utf-8');
      await fs.promises.writeFile(this.distFilePath, JSON.stringify(connections, null, 2), 'utf-8');
  
    } catch (error) {
      console.error('Erro ao registrar serviço:', error.message);
    }
  }
  public async changeServiceStatus({  serviceId, status }: { serviceId: string , status:ServiceStatus}): Promise<void> {
    try {
      const connections = await this.getConnections();
  
      connections.connections.map((relay) => relay.services.find((service) => service.service_id === serviceId).status = status);
  
      await fs.promises.writeFile(this.srcFilePath, JSON.stringify(connections, null, 2), 'utf-8');
      await fs.promises.writeFile(this.distFilePath, JSON.stringify(connections, null, 2), 'utf-8');
  
    } catch (error) {
      console.error('Erro ao registrar serviço:', error.message);
    }
  }
}
