import { UsersRepositoryInterface } from 'src/domain/users/repositories/users.repository.interface';
import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class UserRepository implements UsersRepositoryInterface, OnModuleDestroy {
  private prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
  });

  async onModuleDestroy() {
    try {
      await this.prisma.$disconnect();
    } catch (err) {
      // ignore disconnect errors during shutdown
    }
  }

  async create(data: { name: string; email: string; phone: string; userType?: string }): Promise<any> {
    return this.prisma.user.create({ data });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.user.findMany();
  }

  async update(id: string, data: Partial<{ name: string; email: string; phone: string }>): Promise<any> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<any> {
    return this.prisma.user.delete({ where: { id } });
  }
}