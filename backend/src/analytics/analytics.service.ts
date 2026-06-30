import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ProductSales = {
  productId: number;
  productName: string;
  category: string;
  image: string;
  totalSold: number;
  totalRevenue: number;
  stock: number;
  recommendation: string;
  competitorCount: number;
  savedCompetitorAdsCount: number;
  competitionLevel: string | null;
  opportunityScore: number | null;
  competitorRecommendation: string;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [orders, revenueOrders, pendingOrders, confirmedOrders, cancelledOrders, deliveredOrders, totalCustomers, totalProducts, revenue] =
      await this.prisma.$transaction([
        this.prisma.order.count(),
        this.prisma.order.count({ where: { status: { not: OrderStatus.CANCELLED } } }),
        this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
        this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
        this.prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
        this.prisma.user.count({ where: { role: Role.USER } }),
        this.prisma.product.count(),
        this.prisma.order.aggregate({
          where: { status: { not: OrderStatus.CANCELLED } },
          _sum: { total: true },
        }),
      ]);
    const totalRevenue = this.toNumber(revenue._sum.total);
    return {
      totalRevenue,
      totalOrders: orders,
      pendingOrders,
      confirmedOrders,
      cancelledOrders,
      deliveredOrders,
      totalCustomers,
      totalProducts,
      averageOrderValue: revenueOrders ? totalRevenue / revenueOrders : 0,
    };
  }

  async topProducts() {
    const products = await this.productSales();
    return products.filter((product) => product.totalSold > 0).slice(0, 10);
  }

  async salesByCity() {
    const cities = await this.prisma.order.groupBy({
      by: ['city'],
      where: { status: { not: OrderStatus.CANCELLED } },
      _count: { _all: true },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
    });
    return cities.map((city) => ({
      city: city.city,
      totalOrders: city._count._all,
      totalRevenue: this.toNumber(city._sum.total),
    }));
  }

  async ordersByStatus() {
    const statuses = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
      orderBy: { status: 'asc' },
    });
    return statuses.map((status) => ({ status: status.status, count: status._count._all }));
  }

  async monthlyRevenue() {
    const orders = await this.prisma.order.findMany({
      where: { status: { not: OrderStatus.CANCELLED } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });
    const buckets = new Map<string, { month: string; revenue: number; orders: number }>();
    for (const order of orders) {
      const month = order.createdAt.toISOString().slice(0, 7);
      const current = buckets.get(month) ?? { month, revenue: 0, orders: 0 };
      current.revenue += this.toNumber(order.total);
      current.orders += 1;
      buckets.set(month, current);
    }
    return Array.from(buckets.values()).slice(-12);
  }

  async productResearch() {
    const products = await this.productSales();
    return {
      bestSellingProducts: products.filter((product) => product.totalSold > 0).slice(0, 8),
      lowStockProducts: products.filter((product) => product.stock <= 5).slice(0, 8),
      productsWithoutSales: products.filter((product) => product.totalSold === 0).slice(0, 8),
      recommendedProductsToPromote: products
        .filter((product) => product.totalSold > 0 && product.stock > 5)
        .slice(0, 8),
      competitorAnalyzedProducts: products
        .filter((product) => product.savedCompetitorAdsCount > 0 || product.competitionLevel)
        .sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))
        .slice(0, 12),
    };
  }

  private async productSales(): Promise<ProductSales[]> {
    const [products, sales, competitorAds, competitorInsights] = await this.prisma.$transaction([
      this.prisma.product.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { status: { not: OrderStatus.CANCELLED } } },
        _sum: { quantity: true },
        orderBy: { productId: 'asc' },
      }),
      this.prisma.competitorAd.findMany({
        where: { productId: { not: null } },
        select: { productId: true, competitorId: true },
      }),
      this.prisma.competitorInsight.findMany({
        select: { productId: true, competitionLevel: true, opportunityScore: true },
      }),
    ]);
    const revenueByProduct = await this.prisma.orderItem.findMany({
      where: { order: { status: { not: OrderStatus.CANCELLED } } },
      select: { productId: true, quantity: true, price: true },
    });
    const soldMap = new Map(sales.map((item) => [item.productId, item._sum?.quantity ?? 0]));
    const revenueMap = new Map<number, number>();
    const competitorMap = new Map<number, Set<string>>();
    const adCountMap = new Map<number, number>();
    const insightMap = new Map(competitorInsights.map((insight) => [insight.productId, insight]));
    for (const ad of competitorAds) {
      if (!ad.productId) continue;
      const competitors = competitorMap.get(ad.productId) ?? new Set<string>();
      competitors.add(ad.competitorId);
      competitorMap.set(ad.productId, competitors);
      adCountMap.set(ad.productId, (adCountMap.get(ad.productId) ?? 0) + 1);
    }
    for (const item of revenueByProduct) {
      revenueMap.set(item.productId, (revenueMap.get(item.productId) ?? 0) + this.toNumber(item.price) * item.quantity);
    }
    const enriched = products.map((product) => {
      const totalSold = soldMap.get(product.id) ?? 0;
      const totalRevenue = revenueMap.get(product.id) ?? 0;
      const insight = insightMap.get(product.id);
      const competitorCount = competitorMap.get(product.id)?.size ?? 0;
      const savedCompetitorAdsCount = adCountMap.get(product.id) ?? 0;
      return {
        productId: product.id,
        productName: product.name,
        category: product.category.name,
        image: product.image,
        totalSold,
        totalRevenue,
        stock: product.stock,
        recommendation: this.recommendation(totalSold, totalRevenue, product.stock),
        competitorCount,
        savedCompetitorAdsCount,
        competitionLevel: insight?.competitionLevel ?? null,
        opportunityScore: insight?.opportunityScore ?? null,
        competitorRecommendation: this.competitorRecommendation(
          totalSold,
          product.stock,
          insight?.competitionLevel,
          insight?.opportunityScore,
        ),
      };
    });
    return enriched.sort((a, b) => b.totalRevenue - a.totalRevenue || b.totalSold - a.totalSold);
  }

  private recommendation(totalSold: number, totalRevenue: number, stock: number) {
    if (stock <= 5) return 'Réapprovisionner avant de faire de la publicité';
    if (totalSold === 0) return 'Tester avec un petit budget';
    if (totalRevenue >= 5000) return 'Augmenter le budget sur ce produit';
    return 'Promouvoir ce produit dans les publicités';
  }

  private competitorRecommendation(
    totalSold: number,
    stock: number,
    competitionLevel?: string,
    opportunityScore?: number,
  ) {
    if (competitionLevel === 'HIGH') return 'Marché concurrentiel, utiliser un angle différenciant';
    if ((opportunityScore ?? 0) >= 70 && totalSold > 0 && stock > 5) return 'Forte opportunité publicitaire';
    if (!competitionLevel) return 'Collecter des publicités publiques pour mesurer la concurrence';
    if (stock <= 5) return 'Réapprovisionner avant d’investir en acquisition';
    return 'Tester plusieurs angles avec un budget contrôlé';
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined) {
    if (!value) return 0;
    return Number(value);
  }
}
