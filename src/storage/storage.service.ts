import * as fs from 'fs';
import * as path from 'path';
import { HttpMethod } from 'src/core/enum/HttpMethod';
import { IConnections, IRelay } from 'src/interceptor/interfaces/IConnections';
import { IInsertRelayResponse } from 'src/interceptor/interfaces/IInsertRelayResponse';
import { RemoteService } from 'src/remote/remote.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export class StorageService {
  private remoteService:RemoteService;
  private distFilePath: string;
  private srcFilePath: string;
  private isWriting: boolean = false; 
  private queue: (() => Promise<IInsertRelayResponse>)[] = [];
  private dificulty:number;
  private limitRequestTime: number;

  constructor() {
    this.distFilePath = path.join(__dirname, 'data', 'connections.json');
    this.srcFilePath = path.join(__dirname, 'data', 'connections.json').replace('dist', 'src');
    this.remoteService = new RemoteService();
    this.dificulty = 5;
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


  private async relayTest(connect: IRelay): Promise<boolean> {
    const minerRote = '/miner';
    const body = {
      query: uuidv4(),
      dificulty:this.dificulty
    };
   const response = await this.remoteService.remote<{hash: string; nonce: number}>({
    method: HttpMethod.POST, 
    endpoint:`${connect.relay_connection}${minerRote}`, 
    authorization:connect.id, 
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

  public async insertRelay(newConnection: IRelay): Promise<IInsertRelayResponse> {
    return new Promise((resolve) => {
      const task = async (): Promise<IInsertRelayResponse> => {
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
}
