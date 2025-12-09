import { User } from "src/domain/users/entities/user";
import { ServiceRequest } from "./service-request";

/**
 * Entidade de domínio para Proposta de Serviço
 * Representa quando um profissional se propõe a realizar um serviço
 */
export class ServiceRequestProposal {
    protected id: number;
    protected serviceRequestId: number;
    protected professionalId: number;
    protected status: string;
    protected proposalMessage?: string;
    protected proposedAt: Date;
    protected respondedAt?: Date;
    protected serviceRequest?: ServiceRequest;
    protected professional?: User;
    protected createdAt: Date;
    protected updatedAt: Date;

    constructor(
        id: number,
        serviceRequestId: number,
        professionalId: number,
        status: string,
        proposedAt: Date,
        createdAt: Date,
        updatedAt: Date,
        proposalMessage?: string,
        respondedAt?: Date,
        serviceRequest?: ServiceRequest,
        professional?: User,
    ) {
        this.setId(id);
        this.setServiceRequestId(serviceRequestId);
        this.setProfessionalId(professionalId);
        this.setStatus(status);
        this.setProposedAt(proposedAt);
        this.setCreatedAt(createdAt);
        this.setUpdatedAt(updatedAt);

        if (proposalMessage !== undefined) {
            this.setProposalMessage(proposalMessage);
        }
        if (respondedAt !== undefined) {
            this.setRespondedAt(respondedAt);
        }
        if (serviceRequest !== undefined) {
            this.setServiceRequest(serviceRequest);
        }
        if (professional !== undefined) {
            this.setProfessional(professional);
        }
    }

    getId(): number {
        return this.id;
    }

    setId(id: number): void {
        this.id = id;
    }

    getServiceRequestId(): number {
        return this.serviceRequestId;
    }

    setServiceRequestId(serviceRequestId: number): void {
        this.serviceRequestId = serviceRequestId;
    }

    getProfessionalId(): number {
        return this.professionalId;
    }

    setProfessionalId(professionalId: number): void {
        this.professionalId = professionalId;
    }

    getStatus(): string {
        return this.status;
    }

    setStatus(status: string): void {
        this.status = status;
    }

    getProposalMessage(): string | undefined {
        return this.proposalMessage;
    }

    setProposalMessage(proposalMessage: string): void {
        this.proposalMessage = proposalMessage;
    }

    getProposedAt(): Date {
        return this.proposedAt;
    }

    setProposedAt(proposedAt: Date): void {
        this.proposedAt = proposedAt;
    }

    getRespondedAt(): Date | undefined {
        return this.respondedAt;
    }

    setRespondedAt(respondedAt: Date): void {
        this.respondedAt = respondedAt;
    }

    getServiceRequest(): ServiceRequest | undefined {
        return this.serviceRequest;
    }

    setServiceRequest(serviceRequest: ServiceRequest): void {
        this.serviceRequest = serviceRequest;
    }

    getProfessional(): User | undefined {
        return this.professional;
    }

    setProfessional(professional: User): void {
        this.professional = professional;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    setCreatedAt(createdAt: Date): void {
        this.createdAt = createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    setUpdatedAt(updatedAt: Date): void {
        this.updatedAt = updatedAt;
    }

    /**
     * Verifica se a proposta está pendente
     */
    isPending(): boolean {
        return this.status === 'PENDING';
    }

    /**
     * Verifica se a proposta foi aceita
     */
    isAccepted(): boolean {
        return this.status === 'ACCEPTED';
    }

    /**
     * Verifica se a proposta foi rejeitada
     */
    isRejected(): boolean {
        return this.status === 'REJECTED';
    }

    /**
     * Verifica se a proposta foi cancelada pelo profissional
     */
    isWithdrawn(): boolean {
        return this.status === 'WITHDRAWN';
    }

    /**
     * Aceita a proposta
     */
    accept(): void {
        if (!this.isPending()) {
            throw new Error('Only pending proposals can be accepted');
        }
        this.setStatus('ACCEPTED');
        this.setRespondedAt(new Date());
    }

    /**
     * Rejeita a proposta
     */
    reject(): void {
        if (!this.isPending()) {
            throw new Error('Only pending proposals can be rejected');
        }
        this.setStatus('REJECTED');
        this.setRespondedAt(new Date());
    }

    /**
     * Profissional cancela a proposta
     */
    withdraw(): void {
        if (!this.isPending()) {
            throw new Error('Only pending proposals can be withdrawn');
        }
        this.setStatus('WITHDRAWN');
        this.setRespondedAt(new Date());
    }
}
