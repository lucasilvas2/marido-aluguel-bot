import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from '../events/user/user-registered.event';
import { SpecialtyAddedEvent } from '../events/specialty/specialty-added.event';
import { ConversationCompletedEvent } from '../events/conversation/conversation-completed.event';

/**
 * Listener para enviar métricas e analytics
 * Integra com sistemas de analytics (Google Analytics, Mixpanel, etc)
 */
@Injectable()
export class AnalyticsListener {
  private readonly logger = new Logger(AnalyticsListener.name);

  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(`[ANALYTICS] User registered: ${event.userName} (${event.userType})`);
    
    // await this.analyticsService.track('User Signup', {
    //   userId: event.userId,
    //   userName: event.userName,
    //   userType: event.userType,
    //   source: 'whatsapp',
    //   timestamp: event.timestamp,
    // });
  }

  @OnEvent('specialty.added')
  async handleSpecialtyAdded(event: SpecialtyAddedEvent): Promise<void> {
    this.logger.log(
      `[ANALYTICS] Specialty added: ${event.specialtyName} by user ${event.userId}`
    );
    
    // await this.analyticsService.track('Specialty Added', {
    //   userId: event.userId,
    //   specialtyName: event.specialtyName,
    //   experienceYears: event.experienceYears,
    //   pricePerHour: event.pricePerHour,
    //   isCertified: event.isCertified,
    // });
  }

  @OnEvent('conversation.completed')
  async handleConversationCompleted(event: ConversationCompletedEvent): Promise<void> {
    this.logger.log(
      `[ANALYTICS] Conversation completed: ${event.conversationType} (${event.outcome}) - Duration: ${event.durationMs}ms`
    );
    
    // await this.analyticsService.track('Conversation Completed', {
    //   conversationType: event.conversationType,
    //   outcome: event.outcome,
    //   durationMs: event.durationMs,
    //   totalSteps: event.totalSteps,
    // });
  }
}
