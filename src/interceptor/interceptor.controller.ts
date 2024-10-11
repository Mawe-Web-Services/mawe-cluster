import { Controller, All, Query, HttpException, HttpStatus, Param, Req } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RedirectInterceptor } from './interceptor.service';
import { Request } from 'express';
import { HttpMethod } from 'src/core/enum/HttpMethod';

@Controller('cluster')
export class RedirectController {
  constructor(private readonly httpService: HttpService) {}

  @All()
  async handleClusterWithoutParams(
    @Query() query: Record<string, any>,
    @Req() request: Request
  ) {
    return this.handleAll({ 0: '' }, query, request);
  }

  @All('*')
  async handleAll(
    @Param() params: Record<string, any>,
    @Query() query: Record<string, any>,
    @Req() request: Request
    ) {
    const redirectService = new RedirectInterceptor();
    await redirectService.activateService({serviceId: query.service_id});
    const queryString = new URLSearchParams(query).toString();
    const internalServiceRoutes = params[0];
    const connections = await redirectService.interceptConnection({ serviceId: query.service_id }) as string[];
    
    if (!connections) {
      throw new HttpException('No active services found', HttpStatus.NOT_FOUND);
    }

    const shuffle = (array: string[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; 
      }
      return array;
    }

    const shuffledConnections = shuffle(connections);

    try {
      const requests = shuffledConnections.map((connection) => {
        const url = `${connection}/${internalServiceRoutes}?${queryString}`;

        switch (request.method.toLowerCase()) {
          case HttpMethod.POST:
            return firstValueFrom(this.httpService.post(url, request.body));
          case HttpMethod.PUT:
            return firstValueFrom(this.httpService.put(url, request.body));
          case HttpMethod.DELETE:
            return firstValueFrom(this.httpService.delete(url));
          case HttpMethod.PATCH:
            return firstValueFrom(this.httpService.patch(url, request.body));
          case HttpMethod.HEAD:
            return firstValueFrom(this.httpService.head(url));
          default:
            return firstValueFrom(this.httpService.get(url));
        }
      });

      const response = await Promise.any(requests);

       await redirectService.fetchFastestRelay({responserURL: response.config.url, serviceId: query.service_id});
      return response.data;
    } catch (error) {
      throw new HttpException('All services failed or none returned a valid response', HttpStatus.BAD_GATEWAY);
    }
  }
}
