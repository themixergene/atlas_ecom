import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import { AdCampaignStatus, AdObjective, CreativeType } from '@prisma/client';

export class CreateAdCampaignDto {
  @Type(() => Number)
  @IsInt()
  productId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AdObjective)
  objective: AdObjective;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget: number;

  @IsString()
  @IsNotEmpty()
  city: string;

  @Type(() => Number)
  @IsInt()
  @Min(13)
  @Max(100)
  ageMin: number;

  @Type(() => Number)
  @IsInt()
  @Min(13)
  @Max(100)
  ageMax: number;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsEnum(CreativeType)
  creativeType: CreativeType;

  @IsUrl({ require_protocol: true })
  creativeUrl: string;

  @IsString()
  @IsNotEmpty()
  adCopy: string;

  @IsString()
  @IsNotEmpty()
  strategy: string;

  @IsEnum(AdCampaignStatus)
  @IsOptional()
  status?: AdCampaignStatus;
}

export class GenerateAdStrategyDto {
  @Type(() => Number)
  @IsInt()
  productId: number;

  @IsString()
  @IsNotEmpty()
  city: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget: number;

  @IsEnum(AdObjective)
  objective: AdObjective;
}
