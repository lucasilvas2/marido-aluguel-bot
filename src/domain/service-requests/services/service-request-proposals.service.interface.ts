import { ServiceRequestProposal } from '../entities/service-request-proposal';

/**
 * Interface do serviço de domínio para Propostas de Serviço
 */
export abstract class ServiceRequestProposalsServiceInterface {
    abstract create(
        serviceRequestId: number,
        professionalId: number,
        status: string,
        proposalMessage?: string,
    ): Promise<ServiceRequestProposal>;

    abstract findById(id: number): Promise<ServiceRequestProposal | null>;

    abstract update(
        id: number,
        status: string,
        respondedAt?: Date,
    ): Promise<ServiceRequestProposal>;

    abstract delete(id: number): Promise<void>;

    abstract findByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]>;

    abstract findByProfessionalId(professionalId: number): Promise<ServiceRequestProposal[]>;

    abstract findByStatus(status: string): Promise<ServiceRequestProposal[]>;

    abstract findPendingByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]>;

    abstract countPendingByServiceRequestId(serviceRequestId: number): Promise<number>;

    abstract findByServiceRequestAndProfessional(
        serviceRequestId: number,
        professionalId: number,
    ): Promise<ServiceRequestProposal | null>;

    abstract acceptProposal(proposalId: number): Promise<ServiceRequestProposal>;

    abstract rejectProposal(proposalId: number): Promise<ServiceRequestProposal>;

    abstract withdrawProposal(proposalId: number): Promise<ServiceRequestProposal>;

    abstract rejectAllExcept(serviceRequestId: number, acceptedProposalId: number): Promise<void>;

    abstract all(): Promise<ServiceRequestProposal[]>;
}
