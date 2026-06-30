import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AdObjective,
  CompetitionLevel,
  CompetitorAdPlatform,
  CompetitorAdStatus,
  CompetitorCreativeType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompetitorAdDto } from './dto/create-competitor-ad.dto';
import { CreateCompetitorDto } from './dto/create-competitor.dto';
import { GenerateAdCopyDto } from './dto/generate-ad-copy.dto';
import { UpdateCompetitorAdDto } from './dto/update-competitor-ad.dto';
import { UpdateCompetitorDto } from './dto/update-competitor.dto';

type CopyVariation = {
  type: string;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  angle: string;
  recommendedPlatform: CompetitorAdPlatform;
  creativeIdea: string;
  whyItWorks: string;
};

@Injectable()
export class CompetitorsService {
  constructor(private readonly prisma: PrismaService) {}

  createCompetitor(dto: CreateCompetitorDto) {
    return this.prisma.competitor.create({ data: dto });
  }

  findCompetitors() {
    return this.prisma.competitor.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { ads: true } } },
    });
  }

  async findCompetitor(id: string) {
    const competitor = await this.prisma.competitor.findUnique({
      where: { id },
      include: {
        ads: {
          orderBy: { createdAt: 'desc' },
          include: { product: { select: { id: true, name: true, image: true } } },
        },
      },
    });
    if (!competitor) throw new NotFoundException('Concurrent introuvable.');
    return competitor;
  }

  async updateCompetitor(id: string, dto: UpdateCompetitorDto) {
    await this.findCompetitor(id);
    return this.prisma.competitor.update({ where: { id }, data: dto });
  }

  async removeCompetitor(id: string) {
    await this.findCompetitor(id);
    await this.prisma.competitor.delete({ where: { id } });
    return { message: 'Concurrent supprimé avec succès.' };
  }

  async createAd(dto: CreateCompetitorAdDto) {
    await this.ensureCompetitor(dto.competitorId);
    if (dto.productId) await this.ensureProduct(dto.productId);
    return this.prisma.competitorAd.create({
      data: dto,
      include: { competitor: true, product: { include: { category: true } } },
    });
  }

  findAds(productId?: number, competitorId?: string) {
    return this.prisma.competitorAd.findMany({
      where: {
        ...(productId ? { productId } : {}),
        ...(competitorId ? { competitorId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { competitor: true, product: { include: { category: true } } },
    });
  }

  async findAd(id: string) {
    const ad = await this.prisma.competitorAd.findUnique({
      where: { id },
      include: { competitor: true, product: { include: { category: true } } },
    });
    if (!ad) throw new NotFoundException('Publicité concurrente introuvable.');
    return ad;
  }

  async updateAd(id: string, dto: UpdateCompetitorAdDto) {
    await this.findAd(id);
    if (dto.competitorId) await this.ensureCompetitor(dto.competitorId);
    if (dto.productId) await this.ensureProduct(dto.productId);
    return this.prisma.competitorAd.update({
      where: { id },
      data: dto,
      include: { competitor: true, product: { include: { category: true } } },
    });
  }

  async removeAd(id: string) {
    await this.findAd(id);
    await this.prisma.competitorAd.delete({ where: { id } });
    return { message: 'Publicité concurrente supprimée avec succès.' };
  }

  async analyzeAd(id: string) {
    const ad = await this.findAd(id);
    const analysis = this.analyzeText(
      [ad.headline, ad.primaryText, ad.description, ad.callToAction, ad.offer, ad.inspirationNotes]
        .filter(Boolean)
        .join(' '),
    );
    return this.prisma.competitorAd.update({
      where: { id },
      data: { ...analysis, status: CompetitorAdStatus.ANALYZED },
      include: { competitor: true, product: { include: { category: true } } },
    });
  }

  async researchLinks(productId: number) {
    const product = await this.ensureProduct(productId);
    const query = `${product.name} Maroc boutique`;
    const encoded = encodeURIComponent(query);
    return {
      productName: product.name,
      googleSearchQuery: query,
      metaAdLibrarySuggestion: `${product.name} Maroc`,
      googleAdsTransparencySuggestion: product.name,
      tiktokCreativeCenterSuggestion: `${product.name} e-commerce`,
      facebookSearchSuggestion: `${product.name} Maroc`,
      tiktokSearchSuggestion: `${product.name} Maroc`,
      instagramSearchSuggestion: `${product.name} Maroc`,
      ethicalNotice: 'Liens de recherche publics uniquement. Aucune collecte automatique, aucun contournement et aucun accès à des données privées.',
      links: [
        { platform: 'Google Search', label: 'Trouver des concurrents', url: `https://www.google.com/search?q=${encoded}` },
        { platform: 'Meta Ad Library', label: 'Rechercher des publicités Meta', url: 'https://www.facebook.com/ads/library/' },
        { platform: 'Google Ads Transparency', label: 'Consulter les annonces Google publiques', url: 'https://adstransparency.google.com/' },
        { platform: 'TikTok Creative Center', label: 'Analyser les tendances publicitaires TikTok', url: 'https://ads.tiktok.com/business/creativecenter/' },
        { platform: 'Facebook', label: 'Recherche Facebook manuelle', url: `https://www.facebook.com/search/top?q=${encoded}` },
        { platform: 'TikTok', label: 'Recherche TikTok manuelle', url: `https://www.tiktok.com/search?q=${encoded}` },
        { platform: 'Instagram', label: 'Ouvrir Instagram pour une recherche manuelle', url: 'https://www.instagram.com/' },
      ],
    };
  }

  async generateInsight(productId: number) {
    const product = await this.ensureProduct(productId);
    const ads = await this.prisma.competitorAd.findMany({
      where: { productId },
      include: { competitor: true },
      orderBy: { createdAt: 'desc' },
    });
    const analyzedAds = await Promise.all(
      ads.map(async (ad) => {
        if (ad.status !== CompetitorAdStatus.SAVED) return ad;
        const analysis = this.analyzeText(
          [ad.headline, ad.primaryText, ad.description, ad.callToAction, ad.offer].filter(Boolean).join(' '),
        );
        return this.prisma.competitorAd.update({
          where: { id: ad.id },
          data: { ...analysis, status: CompetitorAdStatus.ANALYZED },
          include: { competitor: true },
        });
      }),
    );
    const level = this.competitionLevel(analyzedAds.length);
    const sales = await this.productSales(productId);
    const offerStrength = analyzedAds.filter((ad) => Boolean(ad.offer)).length;
    const marginSignal = product.comparePrice ? Math.max(0, Number(product.comparePrice) - Number(product.price)) : 0;
    const opportunityScore = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          35 +
            Math.min(product.stock, 20) * 1.5 +
            Math.min(sales, 20) * 1.2 +
            Math.min(marginSignal / 10, 12) -
            analyzedAds.length * 2 +
            Math.max(0, 8 - offerStrength),
        ),
      ),
    );
    const hooks = this.commonValues(analyzedAds.map((ad) => ad.detectedHook));
    const offers = this.commonValues(analyzedAds.map((ad) => ad.offer));
    const ctas = this.commonValues(analyzedAds.map((ad) => ad.callToAction));
    const weaknesses = this.commonValues(analyzedAds.map((ad) => ad.weaknesses));
    const platforms = this.commonValues(analyzedAds.map((ad) => ad.platform));
    const positioning =
      level === CompetitionLevel.HIGH
        ? `Différencier ${product.name} par la preuve, le service local et une démonstration concrète plutôt que par le prix seul.`
        : `Positionner ${product.name} comme une solution fiable, simple à commander et rapidement livrée au Maroc.`;
    const copies = this.buildCopyVariations({
      productName: product.name,
      platform: CompetitorAdPlatform.META,
      angle: level === CompetitionLevel.HIGH ? 'Différenciation et preuve' : 'Praticité et rapidité',
      offer: offers === 'Aucune donnée' ? 'Livraison rapide' : offers.split(',')[0].trim(),
      city: 'Casablanca',
      audience: 'Acheteurs en ligne recherchant une solution fiable',
      objective: AdObjective.SALES,
    });
    const prices = analyzedAds.map((ad) => ad.priceMentioned).filter((price): price is number => price !== null);
    const data = {
      summary: `${analyzedAds.length} publicité(s) publique(s) enregistrée(s) auprès de ${new Set(analyzedAds.map((ad) => ad.competitorId)).size} concurrent(s) pour ${product.name}.`,
      commonHooks: hooks,
      commonOffers: offers,
      commonCallToActions: ctas,
      pricingObservations: prices.length
        ? `Prix concurrents observés entre ${Math.min(...prices).toFixed(0)} et ${Math.max(...prices).toFixed(0)} MAD.`
        : 'Aucun prix concurrent suffisamment documenté.',
      creativePatterns: platforms === 'Aucune donnée' ? 'Formats créatifs encore peu documentés.' : `Présence principalement observée sur : ${platforms}.`,
      competitorWeaknesses: weaknesses,
      recommendedPositioning: positioning,
      recommendedAdCopies: copies as unknown as Prisma.InputJsonValue,
      opportunityScore,
      competitionLevel: level,
    };
    return this.prisma.competitorInsight.upsert({
      where: { productId },
      update: data,
      create: { productId, ...data },
      include: { product: { include: { category: true } } },
    });
  }

  findInsights() {
    return this.prisma.competitorInsight.findMany({
      orderBy: { opportunityScore: 'desc' },
      include: { product: { include: { category: true } } },
    });
  }

  async findProductInsight(productId: number) {
    const insight = await this.prisma.competitorInsight.findUnique({
      where: { productId },
      include: { product: { include: { category: true } } },
    });
    if (!insight) throw new NotFoundException('Aucune analyse concurrentielle générée pour ce produit.');
    return insight;
  }

  async generateAdCopy(dto: GenerateAdCopyDto) {
    const product = await this.ensureProduct(dto.productId);
    return {
      product,
      variations: this.buildCopyVariations({
        productName: product.name,
        platform: dto.platform,
        angle: dto.angle,
        offer: dto.offer,
        city: dto.targetCity,
        audience: dto.audienceType,
        objective: dto.objective,
      }),
    };
  }

  async dashboard() {
    const [totalCompetitors, totalAds, insights, ads] = await this.prisma.$transaction([
      this.prisma.competitor.count(),
      this.prisma.competitorAd.count(),
      this.prisma.competitorInsight.findMany({ select: { productId: true, opportunityScore: true, competitionLevel: true } }),
      this.prisma.competitorAd.findMany({
        select: { callToAction: true, detectedHook: true, platform: true, status: true, createdAt: true },
      }),
    ]);
    const opportunityCount = insights.filter((item) => item.opportunityScore >= 65).length;
    const levelScore = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    const averageLevel = insights.length
      ? Object.entries(levelScore).find(([, value]) => value === Math.round(insights.reduce((sum, item) => sum + levelScore[item.competitionLevel], 0) / insights.length))?.[0] ?? 'MEDIUM'
      : 'LOW';
    const platforms = Object.values(CompetitorAdPlatform).map((platform) => ({
      platform,
      count: ads.filter((ad) => ad.platform === platform).length,
    }));
    return {
      totalCompetitors,
      totalAds,
      analyzedProducts: insights.length,
      opportunitiesDetected: opportunityCount,
      averageCompetitionLevel: averageLevel,
      mostUsedCta: this.mostFrequent(ads.map((ad) => ad.callToAction)) ?? 'Non documenté',
      mostFrequentHook: this.mostFrequent(ads.map((ad) => ad.detectedHook)) ?? 'Non analysé',
      analyzedAds: ads.filter((ad) => ad.status !== CompetitorAdStatus.SAVED).length,
      platformDistribution: platforms,
    };
  }

  private analyzeText(source: string) {
    const text = source.toLocaleLowerCase('fr');
    const includesAny = (keywords: string[]) => keywords.some((keyword) => text.includes(keyword));
    const urgency = includesAny(['limited', 'today', 'last chance', 'stock limité', 'offre limitée', 'aujourd’hui', "aujourd'hui", 'dernière chance']);
    const freeDelivery = includesAny(['free delivery', 'livraison gratuite']);
    const discount = includesAny(['50%', 'promo', 'remise', 'réduction', 'prix réduit', '-20%', '-30%']);
    const trust = includesAny(['guarantee', 'garantie', 'avis clients', 'satisfait', 'témoignage', 'qualité premium']);
    const pain = includesAny(['problem', 'problème', 'fatigué', 'marre', 'difficulté', 'compliqué', 'perdez du temps']);
    const convenience = includesAny(['pratique', 'simple', 'facile', 'rapide', 'gain de temps']);
    const cta = includesAny(['commander', 'acheter', 'profiter', 'message', 'whatsapp']);
    const offer = freeDelivery
      ? 'Livraison gratuite'
      : discount
        ? 'Remise ou prix promotionnel'
        : urgency
          ? 'Offre limitée'
          : 'Offre non explicitée';
    return {
      detectedHook: pain
        ? 'Promesse de résolution d’un problème'
        : discount
          ? 'Prix réduit mis en avant'
          : convenience
            ? 'Promesse de simplicité et de rapidité'
            : 'Présentation directe du bénéfice produit',
      detectedPainPoint: pain ? 'Une difficulté client explicite est utilisée pour créer de l’attention.' : 'Le besoin client reste implicite et pourrait être davantage précisé.',
      detectedAngle: convenience ? 'Praticité et gain de temps' : trust ? 'Qualité et réassurance' : discount ? 'Économie et accessibilité' : 'Bénéfice produit',
      trustElement: trust ? 'Preuve sociale, garantie ou qualité mise en avant' : freeDelivery ? 'Livraison présentée comme élément de réassurance' : 'Peu de preuve de confiance visible',
      urgencyElement: urgency ? 'Offre limitée ou contrainte de temps visible' : 'Aucune urgence forte détectée',
      strengths: [cta ? 'CTA direct' : null, freeDelivery || discount ? 'Offre visible' : null, convenience || pain ? 'Bénéfice clair' : null]
        .filter(Boolean)
        .join(', ') || 'Message simple et rapidement compréhensible',
      weaknesses: [!trust ? 'Manque de preuve sociale' : null, !urgency ? 'Peu d’urgence' : null, !cta ? 'CTA insuffisamment direct' : null]
        .filter(Boolean)
        .join(', ') || 'Peu de détails concrets sur le produit',
      offer,
    };
  }

  private buildCopyVariations(input: {
    productName: string;
    platform: CompetitorAdPlatform;
    angle: string;
    offer: string;
    city: string;
    audience: string;
    objective: AdObjective;
  }): CopyVariation[] {
    const { productName, platform, angle, offer, city, audience } = input;
    return [
      {
        type: 'Réponse directe',
        headline: `${productName} disponible dès maintenant`,
        primaryText: `Découvrez ${productName}, pensé pour ${audience.toLowerCase()}. ${offer}. Livraison rapide à ${city} et commande simple en quelques clics.`,
        description: 'Une offre claire, un produit utile et un service rapide.',
        callToAction: 'Commander maintenant',
        angle,
        recommendedPlatform: platform,
        creativeIdea: 'Démonstration courte du produit avec bénéfice, prix et livraison affichés à l’écran.',
        whyItWorks: 'Le message va directement au bénéfice et réduit les hésitations avant l’achat.',
      },
      {
        type: 'Émotionnelle',
        headline: 'Faites-vous plaisir sans compliquer votre quotidien',
        primaryText: `${productName} apporte une touche de confort et de simplicité au quotidien. ${offer}, avec livraison à ${city}.`,
        description: 'Une expérience d’achat rassurante et agréable.',
        callToAction: 'Découvrir le produit',
        angle: 'Émotion et confort',
        recommendedPlatform: platform,
        creativeIdea: 'Vidéo lifestyle montrant une situation avant et après l’utilisation du produit.',
        whyItWorks: 'La projection émotionnelle aide le client à imaginer le produit dans sa vie.',
      },
      {
        type: 'Problème / Solution',
        headline: 'Une solution simple à un besoin quotidien',
        primaryText: `Vous cherchez plus de simplicité ? ${productName} vous aide à gagner du temps avec une utilisation pratique. ${offer}.`,
        description: 'Moins de contraintes, plus de confort.',
        callToAction: 'Voir la solution',
        angle: 'Problème et solution',
        recommendedPlatform: platform,
        creativeIdea: 'Créatif en deux scènes : difficulté courante, puis résolution avec le produit.',
        whyItWorks: 'Le contraste rend la valeur du produit immédiatement compréhensible.',
      },
      {
        type: 'Offre promotionnelle',
        headline: `${offer} sur ${productName}`,
        primaryText: `Profitez de notre offre sur ${productName}. Stock disponible et livraison rapide à ${city}. Une occasion idéale pour commander aujourd’hui.`,
        description: 'Offre disponible dans la limite du stock.',
        callToAction: 'Profiter de l’offre',
        angle: 'Prix et urgence',
        recommendedPlatform: platform,
        creativeIdea: 'Image produit nette avec l’offre, le prix et un badge de stock limité.',
        whyItWorks: 'L’offre visible et la limite de stock favorisent une décision rapide.',
      },
      {
        type: 'Objectif WhatsApp',
        headline: 'Une question ? Commandez directement sur WhatsApp',
        primaryText: `${productName} est disponible à ${city}. Écrivez-nous sur WhatsApp pour confirmer le stock, poser vos questions et commander rapidement. ${offer}.`,
        description: 'Réponse rapide et accompagnement personnalisé.',
        callToAction: 'Envoyer un message',
        angle: 'Conversation et réassurance',
        recommendedPlatform: CompetitorAdPlatform.META,
        creativeIdea: 'Vidéo verticale avec démonstration produit et capture stylisée d’une conversation WhatsApp.',
        whyItWorks: 'La conversation réduit la friction et rassure les clients qui souhaitent confirmer avant d’acheter.',
      },
    ];
  }

  private competitionLevel(adCount: number) {
    if (adCount <= 2) return CompetitionLevel.LOW;
    if (adCount <= 6) return CompetitionLevel.MEDIUM;
    return CompetitionLevel.HIGH;
  }

  private commonValues(values: Array<string | null | undefined>) {
    const cleaned = values.map((value) => value?.trim()).filter((value): value is string => Boolean(value));
    if (!cleaned.length) return 'Aucune donnée';
    const counts = new Map<string, number>();
    cleaned.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([value]) => value)
      .join(', ');
  }

  private mostFrequent(values: Array<string | null | undefined>) {
    const common = this.commonValues(values);
    return common === 'Aucune donnée' ? null : common.split(',')[0];
  }

  private async productSales(productId: number) {
    const result = await this.prisma.orderItem.aggregate({
      where: { productId, order: { status: { not: OrderStatus.CANCELLED } } },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }

  private async ensureCompetitor(id: string) {
    const competitor = await this.prisma.competitor.findUnique({ where: { id } });
    if (!competitor) throw new NotFoundException('Concurrent introuvable.');
    return competitor;
  }

  private async ensureProduct(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!product) throw new NotFoundException('Produit introuvable.');
    return product;
  }
}
