export type Role = 'USER' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'WHATSAPP_COD';
export type AdCampaignStatus = 'DRAFT' | 'READY' | 'TESTING' | 'WINNING' | 'PAUSED';
export type AdObjective = 'SALES' | 'MESSAGES' | 'TRAFFIC' | 'AWARENESS';
export type CreativeType = 'IMAGE' | 'VIDEO';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
  _count?: { products: number };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  comparePrice: string | null;
  stock: number;
  image: string;
  galleryImages: string[];
  categoryId: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}

export interface PaginatedProducts {
  items: Product[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  product: Product;
}

export interface Order {
  id: number;
  userId: number | null;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  notes: string | null;
  total: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AnalyticsOverview {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  totalProducts: number;
  averageOrderValue: number;
}

export interface TopProductAnalytics {
  productId: number;
  productName: string;
  category: string;
  image: string;
  totalSold: number;
  totalRevenue: number;
  stock: number;
  recommendation: string;
  competitorCount?: number;
  savedCompetitorAdsCount?: number;
  competitionLevel?: CompetitionLevel | null;
  opportunityScore?: number | null;
  competitorRecommendation?: string;
}

export interface SalesByCityAnalytics {
  city: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface OrdersByStatusAnalytics {
  status: OrderStatus;
  count: number;
}

export interface MonthlyRevenueAnalytics {
  month: string;
  revenue: number;
  orders: number;
}

export interface ProductResearch {
  bestSellingProducts: TopProductAnalytics[];
  lowStockProducts: TopProductAnalytics[];
  productsWithoutSales: TopProductAnalytics[];
  recommendedProductsToPromote: TopProductAnalytics[];
  competitorAnalyzedProducts: TopProductAnalytics[];
}

export interface AdStrategy {
  audience: string;
  adCopy: string;
  strategy: string;
  recommendation: string;
}

export interface AdCampaign {
  id: number;
  productId: number;
  name: string;
  objective: AdObjective;
  budget: string;
  city: string;
  ageMin: number;
  ageMax: number;
  gender: string;
  creativeType: CreativeType;
  creativeUrl: string;
  adCopy: string;
  strategy: string;
  status: AdCampaignStatus;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export type CompetitorAdPlatform = 'META' | 'TIKTOK' | 'GOOGLE' | 'INSTAGRAM' | 'OTHER';
export type CompetitorCreativeType = 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'TEXT';
export type CompetitorAdStatus = 'SAVED' | 'ANALYZED' | 'USED_AS_INSPIRATION';
export type CompetitionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Competitor {
  id: string;
  name: string;
  websiteUrl: string | null;
  facebookPageUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  niche: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { ads: number };
}

export interface CompetitorAd {
  id: string;
  competitorId: string;
  productId: number | null;
  platform: CompetitorAdPlatform;
  adUrl: string | null;
  creativeType: CompetitorCreativeType;
  creativeUrl: string | null;
  headline: string | null;
  primaryText: string | null;
  description: string | null;
  callToAction: string | null;
  offer: string | null;
  priceMentioned: number | null;
  landingPageUrl: string | null;
  detectedHook: string | null;
  detectedPainPoint: string | null;
  detectedAngle: string | null;
  trustElement: string | null;
  urgencyElement: string | null;
  strengths: string | null;
  weaknesses: string | null;
  inspirationNotes: string | null;
  status: CompetitorAdStatus;
  createdAt: string;
  updatedAt: string;
  competitor: Competitor;
  product: Product | null;
}

export interface GeneratedCompetitorCopy {
  type?: string;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  angle: string;
  recommendedPlatform: CompetitorAdPlatform;
  creativeIdea: string;
  whyItWorks?: string;
}

export interface CompetitorInsight {
  id: string;
  productId: number;
  summary: string;
  commonHooks: string;
  commonOffers: string;
  commonCallToActions: string;
  pricingObservations: string | null;
  creativePatterns: string | null;
  competitorWeaknesses: string | null;
  recommendedPositioning: string;
  recommendedAdCopies: GeneratedCompetitorCopy[];
  opportunityScore: number;
  competitionLevel: CompetitionLevel;
  createdAt: string;
  updatedAt: string;
  product: Product;
}

export interface CompetitorDashboard {
  totalCompetitors: number;
  totalAds: number;
  analyzedProducts: number;
  opportunitiesDetected: number;
  averageCompetitionLevel: CompetitionLevel;
  mostUsedCta: string;
  mostFrequentHook: string;
  analyzedAds: number;
  platformDistribution: Array<{ platform: CompetitorAdPlatform; count: number }>;
}

export interface CompetitorResearchLinks {
  productName: string;
  ethicalNotice: string;
  links: Array<{ platform: string; label: string; url: string }>;
}
