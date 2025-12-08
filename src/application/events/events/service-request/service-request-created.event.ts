import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando uma nova solicitação de serviço é criada
 */
export class ServiceRequestCreatedEvent extends BaseEvent {
  public readonly eventType = 'service-request.created';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly serviceRequestId: number,
    public readonly specialtyId: number,
    public readonly specialtyName: string,
    public readonly description: string,
    public readonly status: string,
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
