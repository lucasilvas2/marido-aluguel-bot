import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando um cliente aceita uma proposta de um profissional
 */
export class ServiceRequestProposalAcceptedEvent extends BaseEvent {
  public readonly eventType = 'service-request-proposal.accepted';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly serviceRequestId: number,
    public readonly proposalId: number,
    public readonly professionalId: number,
    public readonly clientId: number,
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
