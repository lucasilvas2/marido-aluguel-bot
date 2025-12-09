import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando uma proposta é rejeitada (automaticamente ou manualmente)
 */
export class ServiceRequestProposalRejectedEvent extends BaseEvent {
  public readonly eventType = 'service-request-proposal.rejected';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly serviceRequestId: number,
    public readonly proposalId: number,
    public readonly professionalId: number,
    public readonly rejectedBy: 'client' | 'system', // client = rejeição manual, system = auto-rejeição
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
