import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictException('Un compte avec cette adresse e-mail existe déjà.');
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: await bcrypt.hash(dto.password, 12),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return { user, token: this.sign(user.id, user.email) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Adresse e-mail ou mot de passe incorrect.');
    }
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt };
    return { user: safeUser, token: this.sign(user.id, user.email) };
  }

  private sign(id: number, email: string) {
    return this.jwt.sign({ sub: id, email });
  }
}
