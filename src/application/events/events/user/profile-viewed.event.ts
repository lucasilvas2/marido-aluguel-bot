import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando um usuário visualiza seu perfil
 */
export class ProfileViewedEvent extends BaseEvent {
  public readonly eventType = 'profile.viewed';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly hasSpecialties: boolean,
    public readonly specialtyCount: number,
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
