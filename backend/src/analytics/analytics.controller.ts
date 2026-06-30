import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.analytics.overview();
  }

  @Get('top-products')
  topProducts() {
    return this.analytics.topProducts();
  }

  @Get('sales-by-city')
  salesByCity() {
    return this.analytics.salesByCity();
  }

  @Get('orders-by-status')
  ordersByStatus() {
    return this.analytics.ordersByStatus();
  }

  @Get('monthly-revenue')
  monthlyRevenue() {
    return this.analytics.monthlyRevenue();
  }

  @Get('product-research')
  productResearch() {
    return this.analytics.productResearch();
  }
}
