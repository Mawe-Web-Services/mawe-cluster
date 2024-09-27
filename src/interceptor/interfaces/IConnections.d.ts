export interface IRelayService {
    service_id: string;
    createdAt: string;
    service_connection: string;
  }
  
  export interface IRelay {
    id: string;
    relay_connection: string;
    wallet: string;
    services: IRelayService[];
  }

  export interface IConnections {
    connections: IRelay[];
  }