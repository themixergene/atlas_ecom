import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { CompetitorAdPlatform, CompetitorAdStatus, CompetitorCreativeType } from '@prisma/client';

export class CreateCompetitorAdDto {
  @IsString()
  @IsNotEmpty()
  competitorId: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  productId?: number;

  @IsEnum(CompetitorAdPlatform)
  platform: CompetitorAdPlatform;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  adUrl?: string;

  @IsEnum(CompetitorCreativeType)
  creativeType: CompetitorCreativeType;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  creativeUrl?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  primaryText?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  callToAction?: string;

  @IsString()
  @IsOptional()
  offer?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceMentioned?: number;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  landingPageUrl?: string;

  @IsString()
  @IsOptional()
  inspirationNotes?: string;

  @IsEnum(CompetitorAdStatus)
  @IsOptional()
  status?: CompetitorAdStatus;
}
