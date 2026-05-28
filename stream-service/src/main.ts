import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

function getKafkaBrokers(): string[] {
  return (process.env.KAFKA_BROKERS ?? 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);
}

function isKafkaEnabled(): boolean {
  return (process.env.KAFKA_ENABLED ?? 'true') === 'true';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  if (isKafkaEnabled()) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: process.env.KAFKA_CLIENT_ID ?? 'camera-stream-service',
          brokers: getKafkaBrokers(),
        },
        consumer: {
          groupId:
            process.env.KAFKA_GROUP_ID ?? 'camera-stream-service-consumer',
        },
      },
    });

    await app.startAllMicroservices();
  }

  const port = Number(process.env.PORT ?? 3000);

  await app.listen(port);
}

bootstrap();