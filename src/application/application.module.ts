import { Module } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { UserRegistrationService } from './services/user-registration.service';
import { ConversationStateService } from './services/conversation-state.service';
import { MessageProcessingService } from './services/message-processing.service';
import { InfraestructureModule } from '../infraestructure/infraestructure.module';

@Module({
  imports: [DomainModule, InfraestructureModule],
  providers: [
    UserRegistrationService,
    ConversationStateService,
    MessageProcessingService,
  ],
  exports: [
    UserRegistrationService,
    ConversationStateService,
    MessageProcessingService,
  ],
})
export class ApplicationModule {}
