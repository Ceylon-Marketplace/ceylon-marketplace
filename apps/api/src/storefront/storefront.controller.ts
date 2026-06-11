import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { StorefrontService } from "./storefront.service";

@Controller("storefronts")
export class StorefrontController {
  constructor(private storefrontService: StorefrontService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: any,
    @Body()
    body: {
      name: string;
      description?: string;
      logo?: string;
      banner?: string;
      slug: string;
    },
  ) {
    return this.storefrontService.create(user.sub, body);
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: any) {
    return this.storefrontService.getMine(user.sub);
  }

  @Patch("mine")
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: any,
    @Body()
    body: {
      name?: string;
      description?: string;
      logo?: string;
      banner?: string;
    },
  ) {
    return this.storefrontService.update(user.sub, body);
  }

  @Get(":slug")
  findBySlug(
    @Param("slug") slug: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.storefrontService.findBySlug(slug, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}
