import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { AUTH_SERVICE } from './kafka.constants';

@Injectable()
export class KafkaClientService implements OnModuleInit, OnModuleDestroy {
  private readonly topics = [
    /* AuthService */
    'auth.register',
    'auth.login',
    'auth.refresh',
    'auth.logout',
    'auth.forgot-password',
    'auth.reset-password',
    'user.get-by-id',
    'users.find_all',

    /* GeoService */
    'geo.me',

    /* CameraService */
    'camera.public.cameras.find_all',
    'camera.public.cameras.find_by_id',
    'camera.cameras.create',
    'camera.cameras.find_by_bbox',
    'camera.cameras.find_looking_at_point',
    'camera.admin.cameras.find_all',
    'camera.admin.cameras.update',
    'camera.admin.cameras.delete',

    /* StreamService */
    'streams.get_by_camera_id',
    'streams.get_status_by_camera_id',

    /* Admin Services Status */
    'auth.service.status',
  ];

  constructor(
    @Inject(AUTH_SERVICE)
    private readonly client: ClientKafka,
  ) {}

  async onModuleInit() {
    for (const topic of this.topics) {
      this.client.subscribeToResponseOf(topic);
    }

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  async send<TResult, TPayload = unknown>(
    pattern: string,
    payload: TPayload,
  ): Promise<TResult> {
    try {
      return await firstValueFrom(
        this.client
          .send<TResult, TPayload>(pattern, payload)
          .pipe(timeout(10000)),
      );
    } catch (error) {
      this.throwHttpException(error, pattern);
    }
  }
  
  private throwHttpException(error: unknown, pattern: string): never {
    const err = error as any;
  
    if (err?.name === 'TimeoutError') {
      throw new GatewayTimeoutException(
        `Microservice timeout for Kafka pattern: ${pattern}`,
      );
    }
  
    const response = err?.response ?? err;
    const statusCode = response?.statusCode ?? response?.status;
  
    if (typeof statusCode === 'number') {
      throw new HttpException(
        {
          statusCode,
          code: response?.code ?? 'MICROSERVICE_ERROR',
          message: response?.message ?? 'Microservice error',
        },
        statusCode,
      );
    }
  
    throw new BadGatewayException(
      `Microservice unavailable for Kafka pattern: ${pattern}`,
    );
  }
}