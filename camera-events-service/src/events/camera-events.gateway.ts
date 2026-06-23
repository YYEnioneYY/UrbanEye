import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NormalizedCameraEvent } from './types';

@WebSocketGateway({
  namespace: 'camera-events',
  cors: {
    origin: '*',
  },
})
export class CameraEventsGateway {
  @WebSocketServer()
  private readonly server!: Server;

  @SubscribeMessage('subscribe.camera')
  subscribeCamera(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { cameraId: string },
  ) {
    client.join(`camera:${body.cameraId}`);

    return {
      ok: true,
      room: `camera:${body.cameraId}`,
    };
  }

  @SubscribeMessage('unsubscribe.camera')
  unsubscribeCamera(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { cameraId: string },
  ) {
    client.leave(`camera:${body.cameraId}`);

    return {
      ok: true,
    };
  }

  @SubscribeMessage('subscribe.intersection')
  subscribeIntersection(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { intersectionId: string },
  ) {
    client.join(`intersection:${body.intersectionId}`);

    return {
      ok: true,
      room: `intersection:${body.intersectionId}`,
    };
  }

  @SubscribeMessage('unsubscribe.intersection')
  unsubscribeIntersection(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { intersectionId: string },
  ) {
    client.leave(`intersection:${body.intersectionId}`);

    return {
      ok: true,
    };
  }

  emitCameraEvent(event: NormalizedCameraEvent) {
    this.server.to(`camera:${event.cameraId}`).emit('camera.event', event);

    if (event.intersectionId) {
      this.server
        .to(`intersection:${event.intersectionId}`)
        .emit('camera.event', event);
    }
  }
}