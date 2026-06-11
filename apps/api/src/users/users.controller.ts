import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(":id")
  getPublicProfile(@Param("id") id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Patch("me/profile")
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Patch("me/become-seller")
  @UseGuards(JwtAuthGuard)
  becomeSeller(@CurrentUser() user: any) {
    return this.usersService.becomeSeller(user.id);
  }

  @Post(":id/block")
  @UseGuards(JwtAuthGuard)
  blockUser(@CurrentUser() user: any, @Param("id") targetId: string) {
    return this.usersService.blockUser(user.id, targetId);
  }

  @Delete(":id/block")
  @UseGuards(JwtAuthGuard)
  unblockUser(@CurrentUser() user: any, @Param("id") targetId: string) {
    return this.usersService.unblockUser(user.id, targetId);
  }
}
