import { BaseEvent } from '../../interfaces/base-event.interface';

/**
 * Evento emitido quando uma conversa é finalizada
 */
export class ConversationCompletedEvent extends BaseEvent {
  public readonly eventType = 'conversation.completed';

  constructor(
    phoneNumber: string,
    public readonly conversationType: 'registration' | 'specialty' | 'service' | 'menu',
    public readonly outcome: 'success' | 'cancelled' | 'error',
    public readonly durationMs: number,
    public readonly totalSteps: number,
    metadata?: Record<string, any>
  ) {
    super(undefined, phoneNumber, metadata);
  }
}
