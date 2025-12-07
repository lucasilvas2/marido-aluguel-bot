import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from '../events/user/user-registered.event';
import { SpecialtyAddedEvent } from '../events/specialty/specialty-added.event';
import { ConversationCompletedEvent } from '../events/conversation/conversation-completed.event';
import { ProfileViewedEvent } from '../events/user/profile-viewed.event';

/**
 * Listener para registrar eventos no log para auditoria
 * Processa todos os eventos do sistema
 */
@Injectable()
export class AuditListener {
  private readonly logger = new Logger(AuditListener.name);

  @OnEvent('**')
  async handleAllEvents(event: any): Promise<void> {
    this.logger.log(
      `[AUDIT] Event: ${event.eventType} | ID: ${event.eventId} | User: ${event.userId || 'N/A'} | Phone: ${event.phoneNumber || 'N/A'}`
    );

    // await this.auditRepository.save({
    //   eventType: event.eventType,
    //   eventId: event.eventId,
    //   userId: event.userId,
    //   timestamp: event.timestamp,
    //   payload: JSON.stringify(event),
    // });
  }
}
