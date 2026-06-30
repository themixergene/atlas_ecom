import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AdObjective, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdCampaignDto, GenerateAdStrategyDto } from './dto/create-ad-campaign.dto';
import { UpdateAdCampaignDto } from './dto/update-ad-campaign.dto';

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdCampaignDto) {
    this.ensureAgeRange(dto.ageMin, dto.ageMax);
    await this.ensureProduct(dto.productId);
    return this.prisma.adCampaign.create({
      data: { ...dto, budget: new Prisma.Decimal(dto.budget) },
      include: { product: { include: { category: true } } },
    });
  }

  findAll() {
    return this.prisma.adCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: { include: { category: true } } },
    });
  }

  async findOne(id: number) {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id },
      include: { product: { include: { category: true } } },
    });
    if (!campaign) throw new NotFoundException('Campagne publicitaire introuvable.');
    return campaign;
  }

  async update(id: number, dto: UpdateAdCampaignDto) {
    await this.findOne(id);
    if (dto.productId) await this.ensureProduct(dto.productId);
    if (dto.ageMin !== undefined || dto.ageMax !== undefined) {
      const existing = await this.prisma.adCampaign.findUniqueOrThrow({ where: { id } });
      this.ensureAgeRange(dto.ageMin ?? existing.ageMin, dto.ageMax ?? existing.ageMax);
    }
    return this.prisma.adCampaign.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.budget === undefined ? {} : { budget: new Prisma.Decimal(dto.budget) }),
      },
      include: { product: { include: { category: true } } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.adCampaign.delete({ where: { id } });
    return { message: 'Campagne publicitaire supprimée avec succès.' };
  }

  async generateStrategy(dto: GenerateAdStrategyDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produit introuvable.');
    const category = product.category.name.toLowerCase();
    const price = Number(product.price);
    const objectiveText = this.objectiveText(dto.objective);
    const budgetWindow = dto.budget < 300 ? '3 jours' : '5 jours';
    return {
      audience: `Hommes et femmes de 18 à 35 ans à ${dto.city}, intéressés par ${category}, les achats en ligne et la livraison rapide`,
      adCopy: `Découvrez ${product.name} à ${price.toFixed(0)} MAD avec livraison rapide. Commandez maintenant via WhatsApp.`,
      strategy: `Commencez avec un budget test de ${dto.budget.toFixed(0)} MAD pendant ${budgetWindow}, optimisé pour ${objectiveText}. Si le coût par résultat est satisfaisant, augmentez progressivement le budget de 20 % à 30 %.`,
      recommendation: price > 500 || dto.objective === AdObjective.AWARENESS ? 'Utilisez une vidéo pour obtenir plus d’engagement.' : 'Utilisez une image claire du produit accompagnée de la promesse de livraison.',
    };
  }

  private async ensureProduct(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produit introuvable.');
  }

  private ensureAgeRange(ageMin: number, ageMax: number) {
    if (ageMin > ageMax) throw new BadRequestException('L’âge minimum doit être inférieur à l’âge maximum.');
  }

  private objectiveText(objective: AdObjective) {
    const labels: Record<AdObjective, string> = {
      SALES: 'les achats',
      MESSAGES: 'les messages WhatsApp',
      TRAFFIC: 'les visites de la boutique',
      AWARENESS: 'la portée et la notoriété',
    };
    return labels[objective];
  }
}
