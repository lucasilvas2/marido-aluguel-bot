import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando um usuário adiciona uma nova especialidade
 */
export class SpecialtyAddedEvent extends BaseEvent {
  public readonly eventType = 'specialty.added';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly specialtyId: number,
    public readonly specialtyName: string,
    public readonly experienceYears: number,
    public readonly pricePerHour: number,
    public readonly isCertified: boolean,
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
