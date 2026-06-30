import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { slugify } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: { name: dto.name, slug: dto.slug ? slugify(dto.slug) : slugify(dto.name) },
      });
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.ensureExists(id);
    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.slug ? { slug: slugify(dto.slug) } : dto.name ? { slug: slugify(dto.name) } : {}),
        },
      });
    } catch (error) {
      this.handleKnownError(error);
    }
  }

  async remove(id: number) {
    await this.ensureExists(id);
    try {
      await this.prisma.category.delete({ where: { id } });
      return { message: 'Catégorie supprimée avec succès.' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('Impossible de supprimer une catégorie qui contient des produits.');
      }
      throw error;
    }
  }

  private async ensureExists(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Catégorie introuvable.');
    return category;
  }

  private handleKnownError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Cet identifiant de catégorie existe déjà.');
    }
    throw error;
  }
}
