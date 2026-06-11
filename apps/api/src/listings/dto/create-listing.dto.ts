import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Length,
  Min,
  IsArray,
} from "class-validator";
import { ListingCondition, ListingType } from "@prisma/client";

export class CreateListingDto {
  @IsString()
  @Length(10, 120)
  title: string;

  @IsString()
  description: string;

  @IsString()
  categoryId: string;

  @IsEnum(ListingCondition)
  condition: ListingCondition;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsString()
  location: string;

  @IsEnum(ListingType)
  @IsOptional()
  listingType?: ListingType;

  @IsArray()
  @IsOptional()
  media?: { url: string; type: "IMAGE" | "VIDEO"; order: number }[];
}
