import { ServiceStatus } from "src/core/enum/ServiceStatus";

export interface IRelayService {
    service_id: string;
    createdAt: Date;
    last_request?:Date;
    service_connection?: string;
    dockerImageId?:string;
    status?: ServiceStatus;
    request_count?: number;
    is_hibernate?: boolean;
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