import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando uma solicitação de serviço é cancelada
 */
export class ServiceRequestCancelledEvent extends BaseEvent {
  public readonly eventType = 'service-request.cancelled';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly serviceRequestId: number,
    public readonly cancelledBy: 'client' | 'professional' | 'system',
    public readonly reason?: string,
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
