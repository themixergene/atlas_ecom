import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../types';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto';

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: { include: { product: true } }; user: { select: { id: true; name: true; email: true } } };
}>;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto, user: AuthUser | null) {
    const ids = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: ids } } });
    if (products.length !== new Set(ids).size) throw new BadRequestException('Un ou plusieurs produits sont invalides.');

    const productById = new Map(products.map((product) => [product.id, product]));
    const normalizedItems = dto.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new BadRequestException('Un ou plusieurs produits sont invalides.');
      if (product.stock < item.quantity) throw new BadRequestException(`Le stock de ${product.name} est insuffisant.`);
      return { product, quantity: item.quantity, price: product.price };
    });

    const total = normalizedItems.reduce(
      (sum, item) => sum.plus(item.price.mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of normalizedItems) {
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }
      return tx.order.create({
        data: {
          userId: user?.id,
          customerName: dto.customerName,
          phone: dto.phone,
          city: dto.city,
          address: dto.address,
          notes: dto.notes,
          paymentMethod: dto.paymentMethod,
          total,
          items: {
            create: normalizedItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: { items: { include: { product: true } }, user: { select: { id: true, name: true, email: true } } },
      });
    });

    return { order, whatsappMessage: this.buildWhatsAppMessage(order) };
  }

  findMine(user: AuthUser) {
    return this.prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });
  }

  findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } }, user: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    await this.ensureOrder(id);
    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: { items: { include: { product: true } } },
    });
  }

  async stats() {
    const [users, products, orders, pending, revenue] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
    ]);
    return {
      totalUsers: users,
      totalProducts: products,
      totalOrders: orders,
      totalRevenue: revenue._sum.total ?? new Prisma.Decimal(0),
      pendingOrders: pending,
    };
  }

  private async ensureOrder(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable.');
  }

  private buildWhatsAppMessage(order: OrderWithItems): string {
    const products = order.items.map((item) => `- ${item.product.name} x${item.quantity}`).join('\n');
    return [
      'NOUVELLE COMMANDE',
      '',
      `Numéro de commande : #${order.id}`,
      '',
      'Client :',
      `Nom : ${order.customerName}`,
      `Téléphone : ${order.phone}`,
      '',
      'Adresse :',
      `Ville : ${order.city}`,
      `Adresse : ${order.address}`,
      '',
      'Produits :',
      '',
      products,
      '',
      `Total: ${order.total} MAD`,
      '',
      'Notes :',
      order.notes || 'Aucune note.',
    ].join('\n');
  }
}
