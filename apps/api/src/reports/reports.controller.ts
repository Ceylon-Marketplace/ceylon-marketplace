import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("reports")
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.reportsService.create(user.id, body);
  }

  @Post("disputes")
  @UseGuards(JwtAuthGuard)
  createDispute(@CurrentUser() user: any, @Body() body: any) {
    return this.reportsService.createDispute(user.id, body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "OPERATIONS_MANAGER", "CONTENT_MODERATOR")
  findAll(@Query() query: any) {
    return this.reportsService.findAll({
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
      status: query.status,
    });
  }

  @Patch(":id/resolve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "OPERATIONS_MANAGER", "CONTENT_MODERATOR")
  resolve(
    @CurrentUser() admin: any,
    @Param("id") id: string,
    @Body() body: { action: "resolve" | "dismiss" },
  ) {
    return this.reportsService.resolve(id, admin.id, body.action);
  }
}
