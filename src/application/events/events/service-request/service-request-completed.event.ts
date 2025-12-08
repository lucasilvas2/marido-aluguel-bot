import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando uma solicitação de serviço é concluída
 */
export class ServiceRequestCompletedEvent extends BaseEvent {
  public readonly eventType = 'service-request.completed';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly serviceRequestId: number,
    public readonly professionalId: number,
    public readonly clientId: number,
    public readonly completedAt: Date,
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
