import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { ServiceRequestProposalsServiceInterface } from "./service-request-proposals.service.interface";
import { ServiceRequestProposalsRepositoryInterface } from "../repositories/service-request-proposals.repository.interface";
import { ServiceRequestProposal } from "../entities/service-request-proposal";

/**
 * Serviço de domínio para gerenciar Propostas de Serviço
 */
@Injectable()
export class ServiceRequestProposalsService implements ServiceRequestProposalsServiceInterface {
    constructor(
        protected readonly proposalRepository: ServiceRequestProposalsRepositoryInterface,
    ) {}

    async create(
        serviceRequestId: number,
        professionalId: number,
        status: string,
        proposalMessage?: string,
    ): Promise<ServiceRequestProposal> {
        // Validar limite de propostas (máximo 10)
        const count = await this.proposalRepository.countPendingByServiceRequestId(serviceRequestId);
        if (count >= 10) {
            throw new BadRequestException('Limite de propostas atingido para esta solicitação');
        }

        // Verificar se profissional já propôs
        const existing = await this.proposalRepository.findByServiceRequestAndProfessional(
            serviceRequestId,
            professionalId,
        );
        if (existing) {
            throw new BadRequestException('Você já enviou uma proposta para este serviço');
        }

        return await this.proposalRepository.create(
            serviceRequestId,
            professionalId,
            status,
            proposalMessage,
        );
    }

    async findById(id: number): Promise<ServiceRequestProposal | null> {
        return await this.proposalRepository.findById(id);
    }

    async update(id: number, status: string, respondedAt?: Date): Promise<ServiceRequestProposal> {
        return await this.proposalRepository.update(id, status, respondedAt);
    }

    async delete(id: number): Promise<void> {
        await this.proposalRepository.delete(id);
    }

    async findByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]> {
        return await this.proposalRepository.findByServiceRequestId(serviceRequestId);
    }

    async findByProfessionalId(professionalId: number): Promise<ServiceRequestProposal[]> {
        return await this.proposalRepository.findByProfessionalId(professionalId);
    }

    async findByStatus(status: string): Promise<ServiceRequestProposal[]> {
        return await this.proposalRepository.findByStatus(status);
    }

    async findPendingByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]> {
        return await this.proposalRepository.findPendingByServiceRequestId(serviceRequestId);
    }

    async countPendingByServiceRequestId(serviceRequestId: number): Promise<number> {
        return await this.proposalRepository.countPendingByServiceRequestId(serviceRequestId);
    }

    async findByServiceRequestAndProfessional(
        serviceRequestId: number,
        professionalId: number,
    ): Promise<ServiceRequestProposal | null> {
        return await this.proposalRepository.findByServiceRequestAndProfessional(
            serviceRequestId,
            professionalId,
        );
    }

    /**
     * Aceita uma proposta
     * Valida se a proposta está pendente antes de aceitar
     */
    async acceptProposal(proposalId: number): Promise<ServiceRequestProposal> {
        const proposal = await this.proposalRepository.findById(proposalId);
        
        if (!proposal) {
            throw new NotFoundException('Proposta não encontrada');
        }

        if (!proposal.isPending()) {
            throw new BadRequestException('Apenas propostas pendentes podem ser aceitas');
        }

        proposal.accept();
        return await this.proposalRepository.update(
            proposalId,
            proposal.getStatus(),
            proposal.getRespondedAt(),
        );
    }

    /**
     * Rejeita uma proposta
     * Valida se a proposta está pendente antes de rejeitar
     */
    async rejectProposal(proposalId: number): Promise<ServiceRequestProposal> {
        const proposal = await this.proposalRepository.findById(proposalId);
        
        if (!proposal) {
            throw new NotFoundException('Proposta não encontrada');
        }

        if (!proposal.isPending()) {
            throw new BadRequestException('Apenas propostas pendentes podem ser rejeitadas');
        }

        proposal.reject();
        return await this.proposalRepository.update(
            proposalId,
            proposal.getStatus(),
            proposal.getRespondedAt(),
        );
    }

    /**
     * Profissional cancela sua própria proposta
     * Valida se a proposta está pendente antes de cancelar
     */
    async withdrawProposal(proposalId: number): Promise<ServiceRequestProposal> {
        const proposal = await this.proposalRepository.findById(proposalId);
        
        if (!proposal) {
            throw new NotFoundException('Proposta não encontrada');
        }

        if (!proposal.isPending()) {
            throw new BadRequestException('Apenas propostas pendentes podem ser canceladas');
        }

        proposal.withdraw();
        return await this.proposalRepository.update(
            proposalId,
            proposal.getStatus(),
            proposal.getRespondedAt(),
        );
    }

    /**
     * Rejeita todas as propostas pendentes exceto a aceita
     * Usado quando cliente escolhe um profissional
     */
    async rejectAllExcept(serviceRequestId: number, acceptedProposalId: number): Promise<void> {
        await this.proposalRepository.rejectAllExcept(serviceRequestId, acceptedProposalId);
    }

    async all(): Promise<ServiceRequestProposal[]> {
        return await this.proposalRepository.all();
    }
}
