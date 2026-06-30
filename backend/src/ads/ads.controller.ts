import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { AdsService } from './ads.service';
import { CreateAdCampaignDto, GenerateAdStrategyDto } from './dto/create-ad-campaign.dto';
import { UpdateAdCampaignDto } from './dto/update-ad-campaign.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/ads')
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  @Post()
  create(@Body() dto: CreateAdCampaignDto) {
    return this.ads.create(dto);
  }

  @Get()
  findAll() {
    return this.ads.findAll();
  }

  @Post('generate-strategy')
  generateStrategy(@Body() dto: GenerateAdStrategyDto) {
    return this.ads.generateStrategy(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ads.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdCampaignDto) {
    return this.ads.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ads.remove(id);
  }
}
