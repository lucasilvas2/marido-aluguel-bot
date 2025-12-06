import { Module, Provider } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { UserRegistrationService } from './services/user-registration.service';
import { ConversationStateService } from './services/conversation-state.service';
import { MessageProcessingService } from './services/message-processing.service';
import { InfraestructureModule } from '../infraestructure/infraestructure.module';
import { SpecialtiesAppService } from './services/specialties.app.service';
import { SpecialtiesAppServiceInterface } from './services/interfaces/specialties.app.service.interface';

const services: Provider[] = [
  {
    provide: SpecialtiesAppServiceInterface,
    useClass: SpecialtiesAppService,
  }
];

@Module({
  imports: [DomainModule, InfraestructureModule],
  providers: [
    UserRegistrationService,
    ConversationStateService,
    MessageProcessingService,
    ...services,
  ],
  exports: [
    UserRegistrationService,
    ConversationStateService,
    MessageProcessingService,
    SpecialtiesAppServiceInterface
  ],
})
export class ApplicationModule {}
