import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ServiceRequestProposal } from "src/domain/service-requests/entities/service-request-proposal";
import { ServiceRequestProposalsRepositoryInterface } from "src/domain/service-requests/repositories/service-request-proposals.repository.interface";

@Injectable()
export class ServiceRequestProposalRepository 
    implements ServiceRequestProposalsRepositoryInterface, OnModuleDestroy {
    
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
        serviceRequestId: number,
        professionalId: number,
        status: string,
        proposalMessage?: string,
    ): Promise<ServiceRequestProposal> {
        const proposal = await this.prisma.serviceRequestProposal.create({
            data: {
                serviceRequestId,
                professionalId,
                status,
                proposalMessage,
                proposedAt: new Date(),
            },
        });

        return new ServiceRequestProposal(
            proposal.id,
            proposal.serviceRequestId,
            proposal.professionalId,
            proposal.status,
            proposal.proposedAt,
            proposal.createdAt,
            proposal.updatedAt,
            proposal.proposalMessage || undefined,
            proposal.respondedAt || undefined,
        );
    }

    async findById(id: number): Promise<ServiceRequestProposal | null> {
        const proposal = await this.prisma.serviceRequestProposal.findUnique({
            where: { id },
        });

        return proposal
            ? new ServiceRequestProposal(
                  proposal.id,
                  proposal.serviceRequestId,
                  proposal.professionalId,
                  proposal.status,
                  proposal.proposedAt,
                  proposal.createdAt,
                  proposal.updatedAt,
                  proposal.proposalMessage || undefined,
                  proposal.respondedAt || undefined,
              )
            : null;
    }

    async update(
        id: number,
        status: string,
        respondedAt?: Date,
    ): Promise<ServiceRequestProposal> {
        const proposal = await this.prisma.serviceRequestProposal.update({
            where: { id },
            data: {
                status,
                respondedAt: respondedAt || undefined,
            },
        });

        return new ServiceRequestProposal(
            proposal.id,
            proposal.serviceRequestId,
            proposal.professionalId,
            proposal.status,
            proposal.proposedAt,
            proposal.createdAt,
            proposal.updatedAt,
            proposal.proposalMessage || undefined,
            proposal.respondedAt || undefined,
        );
    }

    async delete(id: number): Promise<void> {
        await this.prisma.serviceRequestProposal.delete({
            where: { id },
        });
    }

    async findByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]> {
        const proposals = await this.prisma.serviceRequestProposal.findMany({
            where: { serviceRequestId },
            orderBy: { proposedAt: 'asc' },
        });

        return proposals.map(
            (p) =>
                new ServiceRequestProposal(
                    p.id,
                    p.serviceRequestId,
                    p.professionalId,
                    p.status,
                    p.proposedAt,
                    p.createdAt,
                    p.updatedAt,
                    p.proposalMessage || undefined,
                    p.respondedAt || undefined,
                ),
        );
    }

    async findByProfessionalId(professionalId: number): Promise<ServiceRequestProposal[]> {
        const proposals = await this.prisma.serviceRequestProposal.findMany({
            where: { professionalId },
            orderBy: { proposedAt: 'desc' },
        });

        return proposals.map(
            (p) =>
                new ServiceRequestProposal(
                    p.id,
                    p.serviceRequestId,
                    p.professionalId,
                    p.status,
                    p.proposedAt,
                    p.createdAt,
                    p.updatedAt,
                    p.proposalMessage || undefined,
                    p.respondedAt || undefined,
                ),
        );
    }

    async findByStatus(status: string): Promise<ServiceRequestProposal[]> {
        const proposals = await this.prisma.serviceRequestProposal.findMany({
            where: { status },
            orderBy: { proposedAt: 'desc' },
        });

        return proposals.map(
            (p) =>
                new ServiceRequestProposal(
                    p.id,
                    p.serviceRequestId,
                    p.professionalId,
                    p.status,
                    p.proposedAt,
                    p.createdAt,
                    p.updatedAt,
                    p.proposalMessage || undefined,
                    p.respondedAt || undefined,
                ),
        );
    }

    async findPendingByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]> {
        const proposals = await this.prisma.serviceRequestProposal.findMany({
            where: {
                serviceRequestId,
                status: 'PENDING',
            },
            orderBy: { proposedAt: 'asc' },
        });

        return proposals.map(
            (p) =>
                new ServiceRequestProposal(
                    p.id,
                    p.serviceRequestId,
                    p.professionalId,
                    p.status,
                    p.proposedAt,
                    p.createdAt,
                    p.updatedAt,
                    p.proposalMessage || undefined,
                    p.respondedAt || undefined,
                ),
        );
    }

    async countPendingByServiceRequestId(serviceRequestId: number): Promise<number> {
        return await this.prisma.serviceRequestProposal.count({
            where: {
                serviceRequestId,
                status: 'PENDING',
            },
        });
    }

    async findByServiceRequestAndProfessional(
        serviceRequestId: number,
        professionalId: number,
    ): Promise<ServiceRequestProposal | null> {
        const proposal = await this.prisma.serviceRequestProposal.findUnique({
            where: {
                serviceRequestId_professionalId: {
                    serviceRequestId,
                    professionalId,
                },
            },
        });

        return proposal
            ? new ServiceRequestProposal(
                  proposal.id,
                  proposal.serviceRequestId,
                  proposal.professionalId,
                  proposal.status,
                  proposal.proposedAt,
                  proposal.createdAt,
                  proposal.updatedAt,
                  proposal.proposalMessage || undefined,
                  proposal.respondedAt || undefined,
              )
            : null;
    }

    async rejectAllExcept(serviceRequestId: number, acceptedProposalId: number): Promise<void> {
        await this.prisma.serviceRequestProposal.updateMany({
            where: {
                serviceRequestId,
                id: { not: acceptedProposalId },
                status: 'PENDING',
            },
            data: {
                status: 'REJECTED',
                respondedAt: new Date(),
            },
        });
    }

    async all(): Promise<ServiceRequestProposal[]> {
        const proposals = await this.prisma.serviceRequestProposal.findMany({
            orderBy: { proposedAt: 'desc' },
        });

        return proposals.map(
            (p) =>
                new ServiceRequestProposal(
                    p.id,
                    p.serviceRequestId,
                    p.professionalId,
                    p.status,
                    p.proposedAt,
                    p.createdAt,
                    p.updatedAt,
                    p.proposalMessage || undefined,
                    p.respondedAt || undefined,
                ),
        );
    }
}
