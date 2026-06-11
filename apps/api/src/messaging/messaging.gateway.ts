import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { MessagingService } from "./messaging.service";

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || "http://localhost:3000" },
  namespace: "messaging",
})
export class MessagingGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private messagingService: MessagingService,
    private jwt: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace("Bearer ", "");
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage("joinConversation")
  handleJoin(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { event: "joined" };
  }

  @SubscribeMessage("sendMessage")
  async handleMessage(
    @MessageBody()
    data: { conversationId: string; content: string; mediaUrl?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const message = await this.messagingService.sendMessage(
        data.conversationId,
        userId,
        data.content,
        data.mediaUrl,
      );

      this.server
        .to(`conversation:${data.conversationId}`)
        .emit("newMessage", message);
    } catch (error: any) {
      client.emit("messageError", { message: error.message });
    }
  }
}
