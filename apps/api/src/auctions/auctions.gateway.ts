import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { AuctionsService } from "./auctions.service";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || "http://localhost:3000" },
  namespace: "auctions",
})
export class AuctionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private auctionsService: AuctionsService,
    private jwt: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace("Bearer ", "");
      if (token) {
        const payload = this.jwt.verify(token, {
          secret: process.env.JWT_SECRET,
        });
        client.data.userId = payload.sub;
      }
    } catch {
      // Guest connection allowed for viewing
    }
  }

  handleDisconnect(client: Socket) {
    const rooms = Array.from(client.rooms);
    rooms.forEach((room) => {
      if (room.startsWith("auction:")) {
        this.server.to(room).emit("viewerLeft", { room });
      }
    });
  }

  @SubscribeMessage("joinAuction")
  handleJoin(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`auction:${data.auctionId}`);
    return { event: "joined", data: { auctionId: data.auctionId } };
  }

  @SubscribeMessage("leaveAuction")
  handleLeave(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`auction:${data.auctionId}`);
    return { event: "left", data: { auctionId: data.auctionId } };
  }

  @SubscribeMessage("placeBid")
  async handleBid(
    @MessageBody() data: { auctionId: string; amount: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit("bidError", { message: "Authentication required" });
      return;
    }

    try {
      const result = await this.auctionsService.placeBid(
        data.auctionId,
        userId,
        data.amount,
      );

      // Broadcast new bid to all users watching this auction
      this.server.to(`auction:${data.auctionId}`).emit("newBid", {
        auctionId: data.auctionId,
        currentPrice: result.auction.currentPrice,
        bidCount: result.auction.bidCount,
        endTime: result.auction.endTime,
        extended: result.extended,
        maskedBidder:
          client.data.userId.slice(0, 2).toUpperCase() + "***",
      });

      client.emit("bidSuccess", {
        bid: result.bid,
        extended: result.extended,
        newEndTime: result.auction.endTime,
      });
    } catch (error: any) {
      client.emit("bidError", { message: error.message });
    }
  }

  broadcastAuctionClose(auctionId: string, result: any) {
    this.server.to(`auction:${auctionId}`).emit("auctionClosed", result);
  }
}
