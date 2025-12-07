import { Module, Provider } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { UserRegistrationService } from './users/services/user-registration.service';
import { ConversationStateAppService } from './messages/services/conversation-state.app.service';
import { MessageProcessingAppService } from './messages/services/message-processing.app.service';
import { InfraestructureModule } from '../infraestructure/infraestructure.module';
import { SpecialtiesAppService } from './specialties/specialties.app.service';
import { SpecialtiesAppServiceInterface } from './specialties/interfaces/specialties.app.service.interface';
import { UserSpecialtyRegistrationService } from './specialties/services/user-specialty-registration.service';

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
    UserSpecialtyRegistrationService,
    ConversationStateAppService,
    MessageProcessingAppService,
    ...services,
  ],
  exports: [
    UserRegistrationService,
    UserSpecialtyRegistrationService,
    ConversationStateAppService,
    MessageProcessingAppService,
    SpecialtiesAppServiceInterface
  ],
})
export class ApplicationModule {}
