import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando um profissional aceita uma solicitação de serviço
 */
export class ServiceRequestAcceptedEvent extends BaseEvent {
  public readonly eventType = 'service-request.accepted';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly serviceRequestId: number,
    public readonly professionalId: number,
    public readonly professionalName: string,
    public readonly clientId: number,
    public readonly clientPhoneNumber: string,
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
