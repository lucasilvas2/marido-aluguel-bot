import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando uma conversa é iniciada
 */
export class ConversationStartedEvent extends BaseEvent {
  public readonly eventType = 'conversation.started';

  constructor(
    phoneNumber: string,
    public readonly conversationType: 'registration' | 'specialty' | 'service' | 'menu',
    public readonly isNewUser: boolean,
    metadata?: Record<string, any>
  ) {
    super(undefined, phoneNumber, metadata);
  }
}
