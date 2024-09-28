type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export interface IRequest {
    authorization: string;
    method: HttpMethod;
    endpoint: string;
    timeout: number;
    body?:object;
    query?:string;
}