import { BaseEvent } from '../../interfaces/base-event.interface';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';

/**
 * Evento emitido quando um novo usuário é cadastrado
 */
export class UserRegisteredEvent extends BaseEvent {
  public readonly eventType = 'user.registered';

  constructor(
    userId: number,
    phoneNumber: string,
    public readonly userName: string,
    public readonly email: string,
    public readonly userType: UserType,
    metadata?: Record<string, any>
  ) {
    super(userId, phoneNumber, metadata);
  }
}
