import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: { attributes: true },
          orderBy: { name: "asc" },
        },
        attributes: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async create(dto: {
    name: string;
    slug: string;
    parentId?: string;
    imageUrl?: string;
  }) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) throw new BadRequestException("Slug already exists");
    return this.prisma.category.create({ data: dto });
  }

  async update(
    id: string,
    dto: {
      name?: string;
      slug?: string;
      imageUrl?: string;
      isActive?: boolean;
    },
  ) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException("Category not found");
    if (dto.slug && dto.slug !== cat.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) throw new BadRequestException("Slug already exists");
    }
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException("Category not found");
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addAttribute(
    categoryId: string,
    dto: {
      name: string;
      type: string;
      required?: boolean;
      options?: string[];
    },
  ) {
    const cat = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!cat) throw new NotFoundException("Category not found");
    return this.prisma.categoryAttribute.create({
      data: { ...dto, categoryId, options: dto.options ?? [] },
    });
  }

  async removeAttribute(categoryId: string, attrId: string) {
    const attr = await this.prisma.categoryAttribute.findFirst({
      where: { id: attrId, categoryId },
    });
    if (!attr) throw new NotFoundException("Attribute not found");
    return this.prisma.categoryAttribute.delete({ where: { id: attrId } });
  }
}
