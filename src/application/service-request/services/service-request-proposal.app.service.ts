import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { ServiceRequestProposalAppServiceInterface } from "../interfaces/service-request-proposal.app.service.interface";
import { ServiceRequestProposalsServiceInterface } from "src/domain/service-requests/services/service-request-proposals.service.interface";
import { ServiceRequestsServiceInterface } from "src/domain/service-requests/services/service-requests.service.interface";
import { UserSpecialtiesServiceInterface } from "src/domain/specialties/services/user-specialties.service.interface";
import { ServiceRequestProposal } from "src/domain/service-requests/entities/service-request-proposal";
import { ServiceRequestStatus } from "src/domain/service-requests/enums/service-request-status.enum";
import { EventEmitterService } from "src/application/events/event-emitter.service";
import { ServiceRequestProposalCreatedEvent } from "src/application/events/events/service-request/service-request-proposal-created.event";
import { ServiceRequestProposalAcceptedEvent } from "src/application/events/events/service-request/service-request-proposal-accepted.event";
import { ServiceRequestProposalRejectedEvent } from "src/application/events/events/service-request/service-request-proposal-rejected.event";

@Injectable()
export class ServiceRequestProposalAppService implements ServiceRequestProposalAppServiceInterface {
    private readonly logger = new Logger(ServiceRequestProposalAppService.name);

    constructor(
        protected readonly proposalService: ServiceRequestProposalsServiceInterface,
        protected readonly serviceRequestService: ServiceRequestsServiceInterface,
        protected readonly userSpecialtiesService: UserSpecialtiesServiceInterface,
        protected readonly eventEmitter: EventEmitterService,
    ) {}

    async create(
        serviceRequestId: number,
        professionalId: number,
        proposalMessage?: string,
    ): Promise<ServiceRequestProposal> {
        // Validar se a solicitação existe e está pendente
        const serviceRequest = await this.serviceRequestService.findById(serviceRequestId);
        if (!serviceRequest) {
            throw new NotFoundException('Solicitação de serviço não encontrada');
        }

        if (serviceRequest.getStatus() !== ServiceRequestStatus.PENDING) {
            throw new BadRequestException('Esta solicitação não está mais disponível para propostas');
        }

        // Criar proposta
        const proposal = await this.proposalService.create(
            serviceRequestId,
            professionalId,
            'PENDING',
            proposalMessage,
        );

        this.logger.log(`Proposal created: ${proposal.getId()} for service request ${serviceRequestId}`);

        return proposal;
    }

    async findById(id: number): Promise<ServiceRequestProposal | null> {
        return await this.proposalService.findById(id);
    }

    async findByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]> {
        return await this.proposalService.findByServiceRequestId(serviceRequestId);
    }

    async findPendingByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]> {
        return await this.proposalService.findPendingByServiceRequestId(serviceRequestId);
    }

    async countPendingByServiceRequestId(serviceRequestId: number): Promise<number> {
        return await this.proposalService.countPendingByServiceRequestId(serviceRequestId);
    }

    /**
     * Cliente aceita uma proposta
     * - Atualiza proposta para ACCEPTED
     * - Atualiza ServiceRequest com professionalId e status ACCEPTED
     * - Rejeita todas outras propostas pendentes
     * - Emite eventos
     */
    async acceptProposal(proposalId: number, serviceRequestId: number): Promise<void> {
        const proposal = await this.proposalService.findById(proposalId);
        if (!proposal) {
            throw new NotFoundException('Proposta não encontrada');
        }

        // Validar que proposta pertence à solicitação informada
        if (proposal.getServiceRequestId() !== serviceRequestId) {
            throw new BadRequestException('Proposta não pertence a esta solicitação');
        }

        // Buscar solicitação de serviço
        const serviceRequest = await this.serviceRequestService.findById(serviceRequestId);
        if (!serviceRequest) {
            throw new NotFoundException('Solicitação de serviço não encontrada');
        }

        // Validar status
        if (serviceRequest.getStatus() !== ServiceRequestStatus.PENDING) {
            throw new BadRequestException('Esta solicitação não está mais disponível');
        }

        // Aceitar proposta
        await this.proposalService.acceptProposal(proposalId);

        // Atualizar ServiceRequest
        await this.serviceRequestService.update(
            serviceRequestId,
            serviceRequest.getClientId(),
            proposal.getProfessionalId(),
            serviceRequest.getSpecialtyId(),
            ServiceRequestStatus.ACCEPTED,
            serviceRequest.getDescription() || '',
        );

        // Rejeitar todas outras propostas
        await this.proposalService.rejectAllExcept(serviceRequestId, proposalId);

        // Emitir evento de aceitação
        const acceptedEvent = new ServiceRequestProposalAcceptedEvent(
            serviceRequest.getClientId(),
            '', // phoneNumber será preenchido pelo listener
            serviceRequestId,
            proposalId,
            proposal.getProfessionalId(),
            serviceRequest.getClientId(),
        );
        await this.eventEmitter.emit(acceptedEvent);

        // Emitir eventos de rejeição para outras propostas
        const rejectedProposals = await this.proposalService.findByServiceRequestId(serviceRequestId);
        for (const rejectedProposal of rejectedProposals) {
            if (rejectedProposal.getId() !== proposalId && rejectedProposal.isRejected()) {
                const rejectedEvent = new ServiceRequestProposalRejectedEvent(
                    rejectedProposal.getProfessionalId(),
                    '', // phoneNumber será preenchido pelo listener
                    serviceRequestId,
                    rejectedProposal.getId(),
                    rejectedProposal.getProfessionalId(),
                    'system',
                );
                await this.eventEmitter.emit(rejectedEvent);
            }
        }

        this.logger.log(`Proposal ${proposalId} accepted for service request ${serviceRequestId}`);
    }

    async rejectProposal(proposalId: number): Promise<void> {
        await this.proposalService.rejectProposal(proposalId);
        this.logger.log(`Proposal ${proposalId} rejected`);
    }

    async withdrawProposal(proposalId: number, professionalId: number): Promise<void> {
        const proposal = await this.proposalService.findById(proposalId);
        if (!proposal) {
            throw new NotFoundException('Proposta não encontrada');
        }

        if (proposal.getProfessionalId() !== professionalId) {
            throw new BadRequestException('Você não pode cancelar proposta de outro profissional');
        }

        await this.proposalService.withdrawProposal(proposalId);
        this.logger.log(`Proposal ${proposalId} withdrawn by professional ${professionalId}`);
    }

    /**
     * Calcula estatísticas do profissional
     * - Serviços completados
     * - Dados de especialidade (experiência, preço, certificação)
     */
    async getProfessionalStats(professionalId: number): Promise<{
        completedServicesCount: number;
        experienceYears?: number;
        pricePerHour?: number;
        isCertified: boolean;
    }> {
        // Contar serviços completados
        const completedServices = await this.serviceRequestService.findByProfessionalId(professionalId);
        const completedCount = completedServices.filter(
            (sr) => sr.getStatus() === ServiceRequestStatus.COMPLETED,
        ).length;

        // Buscar dados de especialidade (pegar primeira especialidade)
        const userSpecialties = await this.userSpecialtiesService.findByUserId(professionalId);
        
        let experienceYears: number | undefined;
        let pricePerHour: number | undefined;
        let isCertified = false;

        if (userSpecialties.length > 0) {
            const firstSpecialty = userSpecialties[0];
            experienceYears = firstSpecialty.getExperienceYears();
            pricePerHour = firstSpecialty.getPricePerHour();
            isCertified = firstSpecialty.getIsCertified();
        }

        return {
            completedServicesCount: completedCount,
            experienceYears,
            pricePerHour,
            isCertified,
        };
    }
}
