import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { OffersService } from "./offers.service";

@Controller("offers")
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private offersService: OffersService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() body: { listingId: string; amount: number; message?: string },
  ) {
    return this.offersService.create(user.sub, body);
  }

  @Get("sent")
  getSent(@CurrentUser() user: any) {
    return this.offersService.getSentOffers(user.sub);
  }

  @Get("received")
  getReceived(@CurrentUser() user: any) {
    return this.offersService.getReceivedOffers(user.sub);
  }

  @Patch(":id/accept")
  accept(@Param("id") id: string, @CurrentUser() user: any) {
    return this.offersService.respond(id, user.sub, "accept");
  }

  @Patch(":id/reject")
  reject(@Param("id") id: string, @CurrentUser() user: any) {
    return this.offersService.respond(id, user.sub, "reject");
  }

  @Delete(":id")
  withdraw(@Param("id") id: string, @CurrentUser() user: any) {
    return this.offersService.withdraw(id, user.sub);
  }
}
