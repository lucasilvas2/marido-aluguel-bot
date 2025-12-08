import { UsersRepositoryInterface } from 'src/domain/users/repositories/users.repository.interface';
import { User } from 'src/domain/users/entities/user';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';
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

  async create(data: { name: string; email: string; phone: string; userType?: string }): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return this.mapToEntity(user);
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.mapToEntity(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map(user => this.mapToEntity(user));
  }

  async update(id: number, data: Partial<{ name: string; email: string; phone: string }>): Promise<User> {
    const user = await this.prisma.user.update({ where: { id }, data });
    return this.mapToEntity(user);
  }

  async delete(id: number): Promise<User> {
    const user = await this.prisma.user.delete({ where: { id } });
    return this.mapToEntity(user);
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (user) {
      console.log(`[UserRepository] Found user: ${user.name}, userType from DB: "${user.userType}" (type: ${typeof user.userType})`);
    }
    return user ? this.mapToEntity(user) : null;
  }

  private mapToEntity(prismaUser: any): User {
    // Converte string do banco para número do enum
    // Aceita tanto "PROFESSIONAL"/"CLIENT" quanto "1"/"2"
    let userTypeNumber: number;
    
    if (prismaUser.userType === 'PROFESSIONAL' || prismaUser.userType === '2' || prismaUser.userType === 2) {
      userTypeNumber = UserType.PROFESSIONAL;
    } else if (prismaUser.userType === 'CLIENT' || prismaUser.userType === '1' || prismaUser.userType === 1) {
      userTypeNumber = UserType.CLIENT;
    } else {
      // Default para CLIENT se não reconhecer
      userTypeNumber = UserType.CLIENT;
    }

    console.log(`[UserRepository] Mapping user: ${prismaUser.name}, DB value: "${prismaUser.userType}" -> Enum: ${userTypeNumber} (CLIENT=${UserType.CLIENT}, PROFESSIONAL=${UserType.PROFESSIONAL})`);

    return new User(
      prismaUser.id,
      prismaUser.name,
      prismaUser.phone,
      userTypeNumber,
      prismaUser.createdAt,
      prismaUser.updatedAt
    );
  }
}