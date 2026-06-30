import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class ProductQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  sort?: 'price_asc' | 'price_desc' | 'newest';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit = 12;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  comparePrice?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @IsUrl({ require_protocol: true })
  image: string;

  @IsArray()
  @IsUrl({ require_protocol: true }, { each: true })
  @IsOptional()
  galleryImages?: string[];

  @Type(() => Number)
  @IsInt()
  categoryId: number;

  @IsBoolean()
  @IsOptional()
  featured = false;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  comparePrice?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  image?: string;

  @IsArray()
  @IsUrl({ require_protocol: true }, { each: true })
  @IsOptional()
  galleryImages?: string[];

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}
