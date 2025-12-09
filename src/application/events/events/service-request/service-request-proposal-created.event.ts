import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando um profissional cria uma proposta para uma solicitação de serviço
 */
export class ServiceRequestProposalCreatedEvent extends BaseEvent {
  public readonly eventType = 'service-request-proposal.created';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly serviceRequestId: number,
    public readonly proposalId: number,
    public readonly professionalId: number,
    public readonly professionalName: string,
    public readonly clientId: number,
    public readonly clientPhoneNumber: string,
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
