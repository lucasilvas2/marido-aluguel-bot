import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserSpecialtiesRepositoryInterface } from 'src/domain/specialties/repositories/user-specialties.repository.interface';

@Injectable()
export class UserSpecialtyRepository implements UserSpecialtiesRepositoryInterface ,OnModuleDestroy {
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

    async create(userId: number, specialtyId: number, experienceYears?: number, pricePerHour?: number, notes?: string, isCertified?: boolean): Promise<void> {
        await this.prisma.userSpecialty.create({
            data: {
                userId,
                specialtyId,
                experienceYears,
                pricePerHour,
                notes,
                isCertified,
            },
        });
    }

    async delete(userId: number, specialtyId: number): Promise<void> {
        await this.prisma.userSpecialty.delete({
            where: {
                userId_specialtyId: {
                    userId,
                    specialtyId,
                },
            },
        });
    }

    async findByUserIdAndSpecialtyId(userId: number, specialtyId: number): Promise<any | null> {
        return this.prisma.userSpecialty.findUnique({
            where: {
                userId_specialtyId: {
                    userId,
                    specialtyId,
                },
            },
        });
    }

    async findByUserId(userId: number): Promise<any[]> {
        return this.prisma.userSpecialty.findMany({
            where: { userId },
        }); 
    }

    async findBySpecialtyId(specialtyId: number): Promise<any[]> {
        return this.prisma.userSpecialty.findMany({
            where: { specialtyId },
        });
    }

    async findAll(): Promise<any[]> {
        return this.prisma.userSpecialty.findMany();
    }

    async deleteByUserId(userId: number): Promise<void> {
        await this.prisma.userSpecialty.deleteMany({
            where: { userId },
        });
    }

    async removeSpecialtyFromUser(userId: number, specialtyId: number): Promise<void> {
        await this.prisma.userSpecialty.delete({
            where: {
                userId_specialtyId: {
                    userId,
                    specialtyId,
                },
            },
        });
    }

    async getSpecialtiesByUserId(userId: number): Promise<any[]> {
        return this.prisma.userSpecialty.findMany({
            where: { userId },
        });
    }
}