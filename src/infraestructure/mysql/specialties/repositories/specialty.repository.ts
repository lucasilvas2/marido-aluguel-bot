import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Specialty } from 'src/domain/specialties/entities/specialty';
import { SpecialtiesRepositoryInterface } from 'src/domain/specialties/repositories/specialties.repository.interface';
@Injectable()
export class SpecialtyRepository implements SpecialtiesRepositoryInterface, OnModuleDestroy{
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

    async create(name: string, description: string): Promise<Specialty> {
        const specialty = await this.prisma.specialty.create({
            data: {
                name,
                description,
            },
        });

        return new Specialty(specialty.id, specialty.name, specialty.description, specialty.createdAt, specialty.updatedAt);
    }

    async getById(id: number): Promise<Specialty | null> {
        const specialty = await this.prisma.specialty.findUnique({
            where: { id },
        });
        return specialty ? 
        new Specialty(specialty.id, specialty.name, specialty.description, specialty.createdAt, specialty.updatedAt) : null;
    }

    async update(id: number, name: string, description: string): Promise<void> {
        await this.prisma.specialty.update({
            where: { id },
            data: {
                name,
                description,
            },
        });
    }   

    async delete(id: number): Promise<void> {
        await this.prisma.specialty.delete({
            where: { id },
        });
    }

    async all(): Promise<Specialty[]> {
        const specialties = await this.prisma.specialty.findMany();
        return specialties.map(
            (specialty) => new Specialty(specialty.id, specialty.name, specialty.description, specialty.createdAt, specialty.updatedAt)
        );
    }
}