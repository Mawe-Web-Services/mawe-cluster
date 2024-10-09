export interface IRedirector {
    interceptConnection: ({serviceId}:{serviceId:string})=>Promise<string[] | boolean>;
}