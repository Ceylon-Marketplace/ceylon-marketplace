import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuctionsService } from "./auctions.service";
import { AuctionsController } from "./auctions.controller";
import { AuctionsGateway } from "./auctions.gateway";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  providers: [AuctionsService, AuctionsGateway],
  controllers: [AuctionsController],
  exports: [AuctionsService],
})
export class AuctionsModule {}
