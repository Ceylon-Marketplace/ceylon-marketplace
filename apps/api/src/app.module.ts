import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ListingsModule } from "./listings/listings.module";
import { AuctionsModule } from "./auctions/auctions.module";
import { MessagingModule } from "./messaging/messaging.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AdminModule } from "./admin/admin.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    AuctionsModule,
    MessagingModule,
    SubscriptionsModule,
    NotificationsModule,
    AdminModule,
    ReportsModule,
  ],
})
export class AppModule {}
