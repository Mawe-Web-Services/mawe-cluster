import { ServiceStatus } from "src/core/enum/ServiceStatus";

export interface IRelayService {
    service_id: string;
    createdAt: Date;
    service_connection?: string;
    status?: ServiceStatus;
    request_count?: number;
  }
  
  export interface IRelay {
    id: string;
    relay_connection: string;
    services: IRelayService[];
  }

  export interface IConnections {
    connections: IRelay[];
    services: IRelayService[];
  }