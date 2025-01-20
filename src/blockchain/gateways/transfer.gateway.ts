import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
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
        try {
            this.server.emit('largeTransfer', transfer);
        }
        catch {
            throw new 
        }
        this.logger.log(`Broadcasted large transfer to ${this.connectedClients.size} clients`);
    }

    @SubscribeMessage("ping")
    handleMessage(client: any) {
        this.logger.log(`connection check from clinet : ${client.id}`)
        return {
            event: "pong",
            data: "the connection is stable",
        }
    }
}