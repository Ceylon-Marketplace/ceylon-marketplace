import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role ?? "USER",
        verificationLevel: "EMAIL",
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
          },
        },
      },
      include: { profile: true },
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    if (!user.isActive)
      throw new UnauthorizedException("Account is suspended");

    return this.issueTokens(user);
  }

  private issueTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        verificationLevel: user.verificationLevel,
        profile: user.profile,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { profile: true },
      });
      if (!user || !user.isActive) throw new UnauthorizedException();
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscription: { include: { plan: true } },
        storefront: true,
      },
    });
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
