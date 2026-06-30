import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GenerateCompetitorInsightDto {
  @Type(() => Number)
  @IsInt()
  productId: number;
}
