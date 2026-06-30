import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CompetitorsService } from './competitors.service';
import { CreateCompetitorAdDto } from './dto/create-competitor-ad.dto';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { GenerateAdCopyDto } from './dto/generate-ad-copy.dto';
import { GenerateCompetitorInsightDto } from './dto/generate-competitor-insight.dto';
import { UpdateCompetitorAdDto } from './dto/update-competitor-ad.dto';
import { UpdateCompetitorDto } from './dto/update-competitor.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class CompetitorsController {
  constructor(private readonly competitors: CompetitorsService) {}

  @Post('competitors')
  createCompetitor(@Body() dto: CreateCompetitorDto) {
    return this.competitors.createCompetitor(dto);
  }

  @Get('competitors')
  findCompetitors() {
    return this.competitors.findCompetitors();
  }

  @Get('competitors/dashboard')
  dashboard() {
    return this.competitors.dashboard();
  }

  @Get('competitors/research-links/:productId')
  researchLinks(@Param('productId', ParseIntPipe) productId: number) {
    return this.competitors.researchLinks(productId);
  }

  @Post('competitors/generate-ad-copy')
  generateAdCopy(@Body() dto: GenerateAdCopyDto) {
    return this.competitors.generateAdCopy(dto);
  }

  @Get('competitors/:id')
  findCompetitor(@Param('id') id: string) {
    return this.competitors.findCompetitor(id);
  }

  @Patch('competitors/:id')
  updateCompetitor(@Param('id') id: string, @Body() dto: UpdateCompetitorDto) {
    return this.competitors.updateCompetitor(id, dto);
  }

  @Delete('competitors/:id')
  removeCompetitor(@Param('id') id: string) {
    return this.competitors.removeCompetitor(id);
  }

  @Post('competitor-ads')
  createAd(@Body() dto: CreateCompetitorAdDto) {
    return this.competitors.createAd(dto);
  }

  @Get('competitor-ads')
  findAds(@Query('productId') productId?: string, @Query('competitorId') competitorId?: string) {
    return this.competitors.findAds(productId ? Number(productId) : undefined, competitorId);
  }

  @Get('competitor-ads/:id')
  findAd(@Param('id') id: string) {
    return this.competitors.findAd(id);
  }

  @Patch('competitor-ads/:id')
  updateAd(@Param('id') id: string, @Body() dto: UpdateCompetitorAdDto) {
    return this.competitors.updateAd(id, dto);
  }

  @Delete('competitor-ads/:id')
  removeAd(@Param('id') id: string) {
    return this.competitors.removeAd(id);
  }

  @Post('competitor-ads/:id/analyze')
  analyzeAd(@Param('id') id: string) {
    return this.competitors.analyzeAd(id);
  }

  @Post('competitor-insights/generate')
  generateInsight(@Body() dto: GenerateCompetitorInsightDto) {
    return this.competitors.generateInsight(dto.productId);
  }

  @Get('competitor-insights')
  findInsights() {
    return this.competitors.findInsights();
  }

  @Get('competitor-insights/product/:productId')
  findProductInsight(@Param('productId', ParseIntPipe) productId: number) {
    return this.competitors.findProductInsight(productId);
  }
}
