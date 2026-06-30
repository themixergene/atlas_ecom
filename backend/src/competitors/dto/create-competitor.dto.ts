import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCompetitorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  websiteUrl?: string;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  facebookPageUrl?: string;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  instagramUrl?: string;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  tiktokUrl?: string;

  @IsString()
  @IsOptional()
  niche?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
