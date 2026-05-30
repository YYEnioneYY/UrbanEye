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

    /* GeoService */
    'geo.me',

    /* StreamService */
    'cameras.find_all',
    'cameras.find_by_id',
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
        this.client.send<TResult, TPayload>(pattern, payload).pipe(timeout(10000)),
      );
    } catch (error) {
      this.throwHttpException(error);
    }
  }

  private throwHttpException(error: unknown): never {
    const err = error as any;

    if (err?.name === 'TimeoutError') {
      throw new GatewayTimeoutException('Auth service timeout');
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

    throw new BadGatewayException('Auth service unavailable');
  }
}