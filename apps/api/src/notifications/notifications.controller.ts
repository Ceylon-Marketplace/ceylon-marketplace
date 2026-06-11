import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.notificationsService.findAll(user.id, {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    });
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markRead(user.id);
  }

  @Patch(":id/read")
  markRead(@CurrentUser() user: any, @Param("id") id: string) {
    return this.notificationsService.markRead(user.id, id);
  }
}
