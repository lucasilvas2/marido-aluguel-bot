import { ServiceRequestProposal } from 'src/domain/service-requests/entities/service-request-proposal';

/**
 * Interface para serviço de aplicação de Propostas de Serviço
 */
export abstract class ServiceRequestProposalAppServiceInterface {
    abstract create(
        serviceRequestId: number,
        professionalId: number,
        proposalMessage?: string,
    ): Promise<ServiceRequestProposal>;

    abstract findById(id: number): Promise<ServiceRequestProposal | null>;

    abstract findByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]>;

    abstract findPendingByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]>;

    abstract countPendingByServiceRequestId(serviceRequestId: number): Promise<number>;

    abstract acceptProposal(proposalId: number, serviceRequestId: number): Promise<void>;

    abstract rejectProposal(proposalId: number): Promise<void>;

    abstract withdrawProposal(proposalId: number, professionalId: number): Promise<void>;

    abstract getProfessionalStats(professionalId: number): Promise<{
        completedServicesCount: number;
        experienceYears?: number;
        pricePerHour?: number;
        isCertified: boolean;
    }>;
}
