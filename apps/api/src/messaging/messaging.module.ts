import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MessagingService } from "./messaging.service";
import { MessagingController } from "./messaging.controller";
import { MessagingGateway } from "./messaging.gateway";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  providers: [MessagingService, MessagingGateway],
  controllers: [MessagingController],
  exports: [MessagingService],
})
export class MessagingModule {}
