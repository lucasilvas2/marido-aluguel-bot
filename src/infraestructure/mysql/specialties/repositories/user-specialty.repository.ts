import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserSpecialtiesRepositoryInterface } from 'src/domain/specialties/repositories/user-specialties.repository.interface';
import { UserSpecialty } from 'src/domain/specialties/entities/user-specialty';
import { Specialty } from 'src/domain/specialties/entities/specialty';

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

    async findByUserIdAndSpecialtyId(userId: number, specialtyId: number): Promise<UserSpecialty | null> {
        const userSpecialty = await this.prisma.userSpecialty.findUnique({
            where: {
                userId_specialtyId: {
                    userId,
                    specialtyId,
                },
            },
            include: {
                specialty: true,
                user: true,
            },
        });

        return userSpecialty ? this.mapToEntity(userSpecialty) : null;
    }

    async findByUserId(userId: number): Promise<UserSpecialty[]> {
        const userSpecialties = await this.prisma.userSpecialty.findMany({
            where: { userId },
            include: {
                specialty: true,
                user: true,
            },
        });
        
        return userSpecialties.map(us => this.mapToEntity(us));
    }

    async findBySpecialtyId(specialtyId: number): Promise<UserSpecialty[]> {
        const userSpecialties = await this.prisma.userSpecialty.findMany({
            where: { specialtyId },
            include: {
                specialty: true,
                user: true,
            },
        });
        
        return userSpecialties.map(us => this.mapToEntity(us));
    }

    async findAll(): Promise<UserSpecialty[]> {
        const userSpecialties = await this.prisma.userSpecialty.findMany({
            include: {
                specialty: true,
                user: true,
            },
        });
        
        return userSpecialties.map(us => this.mapToEntity(us));
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

    async getSpecialtiesByUserId(userId: number): Promise<UserSpecialty[]> {
        const userSpecialties = await this.prisma.userSpecialty.findMany({
            where: { userId },
            include: {
                specialty: true,
                user: true,
            },
        });
        
        return userSpecialties.map(us => this.mapToEntity(us));
    }

    private mapToEntity(prismaUserSpecialty: any): UserSpecialty {
        // Mapeia a especialidade
        const specialty = new Specialty(
            prismaUserSpecialty.specialty.id,
            prismaUserSpecialty.specialty.name,
            prismaUserSpecialty.specialty.description || undefined,
            prismaUserSpecialty.specialty.createdAt,
            prismaUserSpecialty.specialty.updatedAt
        );

        // Cria a entidade UserSpecialty
        return new UserSpecialty(
            prismaUserSpecialty.userId,
            prismaUserSpecialty.specialtyId,
            prismaUserSpecialty.user,
            specialty,
            prismaUserSpecialty.isCertified ?? false,
            prismaUserSpecialty.createdAt,
            prismaUserSpecialty.updatedAt,
            prismaUserSpecialty.experienceYears ?? undefined,
            prismaUserSpecialty.pricePerHour ?? undefined,
            prismaUserSpecialty.notes ?? undefined
        );
    }
}