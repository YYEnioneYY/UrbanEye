import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_SERVICE } from './kafka.constants';
import { KafkaClientService } from './kafka-client.service';

function getKafkaBrokers(configService: ConfigService): string[] {
  return (configService.get<string>('KAFKA_BROKERS') ?? 'localhost:9094')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);
}

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId:
                configService.get<string>('KAFKA_CLIENT_ID') ?? 'api-gateway',
              brokers: getKafkaBrokers(configService),
            },
            consumer: {
              groupId:
                configService.get<string>('KAFKA_GROUP_ID') ??
                'api-gateway-consumer',
            },
          },
        }),
      },
    ]),
  ],
  providers: [KafkaClientService],
  exports: [KafkaClientService],
})
export class KafkaModule {}