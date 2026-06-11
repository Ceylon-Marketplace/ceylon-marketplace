import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuctionsService } from "./auctions.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("auctions")
export class AuctionsController {
  constructor(private auctionsService: AuctionsService) {}

  @Get()
  findActive(@Query() query: any) {
    return this.auctionsService.findActive({
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.auctionsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.auctionsService.create(user.id, {
      ...body,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    });
  }

  @Post(":id/close")
  @UseGuards(JwtAuthGuard)
  close(@Param("id") id: string) {
    return this.auctionsService.closeAuction(id);
  }
}
