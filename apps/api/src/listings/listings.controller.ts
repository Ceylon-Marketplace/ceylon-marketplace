import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Optional,
} from "@nestjs/common";
import { ListingsService } from "./listings.service";
import { CreateListingDto } from "./dto/create-listing.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("listings")
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get("categories")
  getCategories() {
    return this.listingsService.getCategories();
  }

  @Get("saved")
  @UseGuards(JwtAuthGuard)
  getSaved(@CurrentUser() user: any) {
    return this.listingsService.getSavedListings(user.sub);
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: any, @Query("status") status?: any) {
    return this.listingsService.getMyListings(user.sub, status);
  }

  @Get()
  search(@Query() query: any) {
    return this.listingsService.search({
      keyword: query.keyword,
      categoryId: query.categoryId,
      sellerId: query.sellerId,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      location: query.location,
      condition: query.condition,
      listingType: query.listingType,
      sortBy: query.sortBy,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 24,
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user?: any) {
    return this.listingsService.findById(id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.id, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.listingsService.update(id, user.id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: any, @Param("id") id: string) {
    return this.listingsService.delete(id, user.id);
  }

  @Post(":id/save")
  @UseGuards(JwtAuthGuard)
  save(@CurrentUser() user: any, @Param("id") id: string) {
    return this.listingsService.saveListing(user.id, id);
  }

  @Delete(":id/save")
  @UseGuards(JwtAuthGuard)
  unsave(@CurrentUser() user: any, @Param("id") id: string) {
    return this.listingsService.unsaveListing(user.id, id);
  }
}
