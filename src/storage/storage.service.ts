import * as fs from 'fs';
import * as path from 'path';
import { IConnections } from 'src/interceptor/interfaces/IConnections';

export class StorageService {
  private filePath: string;

  constructor() {
    this.filePath = path.join(__dirname, 'data', 'connections.json');
  }

  public async getConnections(): Promise<IConnections> {
    try {
      if (!fs.existsSync(this.filePath)) {
        throw new Error(`O arquivo ${this.filePath} não foi encontrado.`);
      }

      const data = await fs.promises.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao buscar os dados:', error.message);
      throw error;
    }
  }
}
