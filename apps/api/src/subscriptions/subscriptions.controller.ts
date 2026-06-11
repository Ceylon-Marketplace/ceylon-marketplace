import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from "@nestjs/common";
import { SubscriptionsService } from "./subscriptions.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get("plans")
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: any) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @Post("plans/:planId/subscribe")
  @UseGuards(JwtAuthGuard)
  subscribe(@CurrentUser() user: any, @Param("planId") planId: string) {
    return this.subscriptionsService.subscribe(user.id, planId);
  }

  @Delete("mine")
  @UseGuards(JwtAuthGuard)
  cancel(@CurrentUser() user: any) {
    return this.subscriptionsService.cancel(user.id);
  }
}
