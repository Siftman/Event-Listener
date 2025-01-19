import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'transfers'
})
export class TransferGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(TransferGateway.name);
    private connectedClients: Set<Socket> = new Set();

    handleConnection(client: Socket) {
        this.connectedClients.add(client);
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.connectedClients.delete(client);
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    broadcastTransfer(transfer: any) {
        this.server.emit('largeTransfer', transfer);
        this.logger.log(`Broadcasted large transfer to ${this.connectedClients.size} clients`);
    }
}