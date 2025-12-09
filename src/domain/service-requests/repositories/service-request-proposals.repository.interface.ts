import { ServiceRequestProposal } from '../entities/service-request-proposal';

/**
 * Interface do repositório de Propostas de Serviço
 */
export abstract class ServiceRequestProposalsRepositoryInterface {
    /**
     * Cria uma nova proposta
     */
    abstract create(
        serviceRequestId: number,
        professionalId: number,
        status: string,
        proposalMessage?: string,
    ): Promise<ServiceRequestProposal>;

    /**
     * Busca proposta por ID
     */
    abstract findById(id: number): Promise<ServiceRequestProposal | null>;

    /**
     * Atualiza uma proposta
     */
    abstract update(
        id: number,
        status: string,
        respondedAt?: Date,
    ): Promise<ServiceRequestProposal>;

    /**
     * Deleta uma proposta
     */
    abstract delete(id: number): Promise<void>;

    /**
     * Busca todas as propostas de uma solicitação de serviço
     */
    abstract findByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]>;

    /**
     * Busca todas as propostas de um profissional
     */
    abstract findByProfessionalId(professionalId: number): Promise<ServiceRequestProposal[]>;

    /**
     * Busca propostas por status
     */
    abstract findByStatus(status: string): Promise<ServiceRequestProposal[]>;

    /**
     * Busca propostas pendentes de uma solicitação de serviço
     */
    abstract findPendingByServiceRequestId(serviceRequestId: number): Promise<ServiceRequestProposal[]>;

    /**
     * Conta propostas pendentes de uma solicitação de serviço
     */
    abstract countPendingByServiceRequestId(serviceRequestId: number): Promise<number>;

    /**
     * Busca proposta específica de um profissional para uma solicitação
     */
    abstract findByServiceRequestAndProfessional(
        serviceRequestId: number,
        professionalId: number,
    ): Promise<ServiceRequestProposal | null>;

    /**
     * Rejeita todas as propostas pendentes de uma solicitação exceto a informada
     */
    abstract rejectAllExcept(serviceRequestId: number, acceptedProposalId: number): Promise<void>;

    /**
     * Lista todas as propostas
     */
    abstract all(): Promise<ServiceRequestProposal[]>;
}
