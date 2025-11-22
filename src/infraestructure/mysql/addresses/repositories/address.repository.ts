import { AddressesRepositoryInterface } from 'src/domain/addresses/repositories/addresses.repository.interface';
import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class AddressRepository implements AddressesRepositoryInterface, OnModuleDestroy {
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

  async create(data: { street: string; city: string; zipCode: string; country: string; number?: string; state: string; neighborhood: string; userId: string }): Promise<any> {
    return this.prisma.address.create({ data });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.address.findUnique({ where: { id } });
  }

  async findAll(): Promise<any[]> {
    return this.prisma.address.findMany();
  }

  async update(id: string, data: Partial<{ street: string; city: string; zipCode: string; country: string; number?: string }>): Promise<any> {
    return this.prisma.address.update({ where: { id }, data });
  }

  async delete(id: string): Promise<any> {
    return this.prisma.address.delete({ where: { id } });
  }
}