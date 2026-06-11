import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { MessagingService } from "./messaging.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get()
  getConversations(@CurrentUser() user: any) {
    return this.messagingService.getConversations(user.id);
  }

  @Post("listing/:listingId")
  startConversation(
    @CurrentUser() user: any,
    @Param("listingId") listingId: string,
  ) {
    return this.messagingService.getOrCreateConversation(user.id, listingId);
  }

  @Get(":id/messages")
  getMessages(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Query() query: any,
  ) {
    return this.messagingService.getMessages(id, user.id, {
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 50,
    });
  }

  @Post(":id/messages")
  sendMessage(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: { content: string; mediaUrl?: string },
  ) {
    return this.messagingService.sendMessage(
      id,
      user.id,
      body.content,
      body.mediaUrl,
    );
  }
}
