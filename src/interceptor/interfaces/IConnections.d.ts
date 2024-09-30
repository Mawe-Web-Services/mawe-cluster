export interface IRelayService {
    service_id: string;
    createdAt: Date;
    service_connection?: string;
  }
  
  export interface IRelay {
    id: string;
    relay_connection: string;
    wallet: string;
    services: IRelayService[];
  }

  export interface IConnections {
    connections: IRelay[];
    services: IRelayService[];
  }