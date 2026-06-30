import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { AdObjective, CompetitorAdPlatform } from '@prisma/client';

export class GenerateAdCopyDto {
  @Type(() => Number)
  @IsInt()
  productId: number;

  @IsEnum(CompetitorAdPlatform)
  platform: CompetitorAdPlatform;

  @IsString()
  @IsNotEmpty()
  angle: string;

  @IsString()
  @IsNotEmpty()
  offer: string;

  @IsString()
  @IsNotEmpty()
  targetCity: string;

  @IsString()
  @IsNotEmpty()
  audienceType: string;

  @IsEnum(AdObjective)
  objective: AdObjective;
}
