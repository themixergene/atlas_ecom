import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { slugify } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 50);
    const where: Prisma.ProductWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { shortDescription: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.featured === undefined ? {} : { featured: query.featured }),
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { price: 'asc' }
        : query.sort === 'price_desc'
          ? { price: 'desc' }
          : { createdAt: 'desc' };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { category: true },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async findOne(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug }, include: { category: true } });
    if (!product) throw new NotFoundException('Produit introuvable.');
    return product;
  }

  async create(dto: CreateProductDto) {
    await this.ensureCategory(dto.categoryId);
    try {
      return await this.prisma.product.create({
        data: {
          ...dto,
          slug: dto.slug ? slugify(dto.slug) : slugify(dto.name),
          price: new Prisma.Decimal(dto.price),
          comparePrice: dto.comparePrice === undefined ? null : new Prisma.Decimal(dto.comparePrice),
          galleryImages: dto.galleryImages ?? [],
        },
        include: { category: true },
      });
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.ensureProduct(id);
    if (dto.categoryId) await this.ensureCategory(dto.categoryId);
    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.name && !dto.slug ? { slug: slugify(dto.name) } : {}),
          ...(dto.slug ? { slug: slugify(dto.slug) } : {}),
          ...(dto.price === undefined ? {} : { price: new Prisma.Decimal(dto.price) }),
          ...(dto.comparePrice === undefined ? {} : { comparePrice: new Prisma.Decimal(dto.comparePrice) }),
        },
        include: { category: true },
      });
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async remove(id: number) {
    await this.ensureProduct(id);
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Produit supprimé avec succès.' };
  }

  private async ensureCategory(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Catégorie introuvable.');
  }

  private async ensureProduct(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produit introuvable.');
  }

  private handleKnownError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Cet identifiant de produit existe déjà.');
    }
    throw error;
  }
}
