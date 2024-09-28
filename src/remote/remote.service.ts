import Axios, { AxiosInstance } from 'axios';
import { IAxiosInstanceParams } from 'src/core/interfaces/IAxiosInstance';
import { IRequest } from 'src/core/interfaces/IRequest';
import { IReturn } from 'src/core/interfaces/IReturn';

export class RemoteService {
    private authorization: string;
    private axiosInstance: AxiosInstance;
    constructor(){
        this.authorization = 'your-auth-token'
    };

    public async getAxiosIntance({authorization,timeout,connection}:IAxiosInstanceParams){
        this.authorization = authorization;
        this.axiosInstance = Axios.create({
            baseURL:connection,
            timeout: timeout,
            headers:{
                'Authorization':this.authorization
            }
        })

        return this.axiosInstance;
    }

    public async remote<T>({ authorization, method, endpoint, body, timeout }: IRequest): Promise<IReturn<T>> {
        this.authorization = authorization;
        try {
            const axiosInstance: AxiosInstance = await this.getAxiosIntance({ 
                authorization: this.authorization,
                timeout: timeout, 
                connection: endpoint,
            });
            const config = {
                method,
                url: `${endpoint}`,
                ...(method !== 'get' && { data: body }),
            };
            const response = await axiosInstance.request(config);

            return { result: response?.data };
        } catch (err) {
            const error = err as Error;
            return { error, result: undefined as unknown as T };
        }
    }
}