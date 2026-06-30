import { PartialType } from '@nestjs/mapped-types';
import { CreateCompetitorAdDto } from './create-competitor-ad.dto';

export class UpdateCompetitorAdDto extends PartialType(CreateCompetitorAdDto) {}
