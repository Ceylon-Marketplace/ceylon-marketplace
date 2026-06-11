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
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "OPERATIONS_MANAGER", "CONTENT_MODERATOR")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("stats")
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get("users")
  getUsers(@Query() query: any) {
    return this.adminService.getUsers({
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
      search: query.search,
      role: query.role,
    });
  }

  @Patch("users/:id/suspend")
  @Roles("SUPER_ADMIN", "OPERATIONS_MANAGER")
  suspendUser(
    @CurrentUser() admin: any,
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    return this.adminService.suspendUser(id, admin.id, body.reason);
  }

  @Patch("users/:id/reinstate")
  @Roles("SUPER_ADMIN", "OPERATIONS_MANAGER")
  reinstateUser(@CurrentUser() admin: any, @Param("id") id: string) {
    return this.adminService.reinstateUser(id, admin.id);
  }

  @Get("listings/pending")
  getPendingListings(@Query() query: any) {
    return this.adminService.getPendingListings({
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    });
  }

  @Post("listings/:id/approve")
  approveListing(@CurrentUser() admin: any, @Param("id") id: string) {
    return this.adminService.moderateListing(id, "approve", admin.id);
  }

  @Post("listings/:id/reject")
  rejectListing(
    @CurrentUser() admin: any,
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    return this.adminService.moderateListing(id, "reject", admin.id, body.reason);
  }

  @Get("audit-logs")
  @Roles("SUPER_ADMIN")
  getAuditLogs(@Query() query: any) {
    return this.adminService.getAuditLogs({
      page: query.page ? Number(query.page) : 1,
    });
  }
}
