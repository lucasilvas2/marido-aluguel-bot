import { Injectable } from "@nestjs/common";
import { OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ServiceRequest } from "src/domain/service-requests/entities/service-request";
import { ServiceRequestsRepositoryInterface } from "src/domain/service-requests/repositories/service-requests.repository.interface";

@Injectable()
export class ServiceRequestRepository implements ServiceRequestsRepositoryInterface, OnModuleDestroy{
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

    async create(
        clientId: number, 
        professionalId: number, 
        specialtyId: number, 
        status: string, 
        description: string
    ): Promise<ServiceRequest> {
        const sr = await this.prisma.serviceRequest.create({
            data: {
                clientId: clientId,
                professionalId: professionalId,
                specialtyId: specialtyId,
                status: status,
                description: description,
            },
        });

        return new ServiceRequest(
            sr.id, sr.clientId, 
            sr.professionalId, 
            sr.specialtyId, 
            sr.status, 
            sr.description, 
            sr.createdAt, 
            sr.updatedAt
        );
    }

    async findById(id: number): Promise<ServiceRequest | null> {
        const sr = await this.prisma.serviceRequest.findUnique({
            where: { id },
        });
        return sr ? 
        new ServiceRequest(
            sr.id, 
            sr.clientId, 
            sr.professionalId, 
            sr.specialtyId, 
            sr.status, 
            sr.description, 
            sr.createdAt, 
            sr.updatedAt
        ) : null;
    }

    async update(
        id: number, 
        clientId: number,
        professionalId: number,
        specialtyId: number,
        status: string,
        description: string
    ): Promise<ServiceRequest> {
        const sr = await this.prisma.serviceRequest.update({
            where: { id },
            data: {
                clientId: clientId,
                professionalId: professionalId,
                specialtyId: specialtyId,
                status: status,
                description: description,
            },
        });

        return new ServiceRequest(
            sr.id, 
            sr.clientId, 
            sr.professionalId, 
            sr.specialtyId, 
            sr.status, 
            sr.description, 
            sr.createdAt, 
            sr.updatedAt
        );
    }

    async delete(id: number): Promise<void> {
        await this.prisma.serviceRequest.delete({
            where: { id },
        });
    }

    async findByClientId(clientId: number): Promise<ServiceRequest[]> {
        const srs = await this.prisma.serviceRequest.findMany({
            where: { clientId },
        });

        return srs.map(
            (sr) => new ServiceRequest(
                sr.id,
                sr.clientId,
                sr.professionalId,
                sr.specialtyId,
                sr.status,
                sr.description,
                sr.createdAt,
                sr.updatedAt
            )
        );
    }

    async findByProfessionalId(professionalId: number): Promise<ServiceRequest[]> {
        const srs = await this.prisma.serviceRequest.findMany({
            where: { professionalId },
        }); 
        return srs.map(
            (sr) => new ServiceRequest(
                sr.id,
                sr.clientId,
                sr.professionalId,
                sr.specialtyId,
                sr.status,
                sr.description,
                sr.createdAt,
                sr.updatedAt
            )
        );
    }
    async findByStatus(status: string): Promise<ServiceRequest[]> {
        const srs = await this.prisma.serviceRequest.findMany({
            where: { status },
        });

        return srs.map(
            (sr) => new ServiceRequest(
                sr.id,
                sr.clientId,
                sr.professionalId,
                sr.specialtyId,
                sr.status,
                sr.description,
                sr.createdAt,
                sr.updatedAt
            )
        );
    }

    async all(): Promise<ServiceRequest[]> {
        const srs = await this.prisma.serviceRequest.findMany();

        return srs.map(
            (sr) => new ServiceRequest(
                sr.id,
                sr.clientId,
                sr.professionalId,
                sr.specialtyId,
                sr.status,
                sr.description,
                sr.createdAt,
                sr.updatedAt
            )
        );
    } 

    async findBySpecialtyId(specialtyId: number): Promise<ServiceRequest[]> {
        const srs = await this.prisma.serviceRequest.findMany({
            where: { specialtyId },
        }); 
        return srs.map(
            (sr) => new ServiceRequest(
                sr.id,
                sr.clientId,
                sr.professionalId,
                sr.specialtyId,
                sr.status,
                sr.description,
                sr.createdAt,
                sr.updatedAt
            )
        );
    }

}