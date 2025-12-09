import { Module, Provider } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { UserRegistrationService } from './users/services/user-registration.service';
import { ConversationStateAppService } from './messages/services/conversation-state.app.service';
import { MessageProcessingAppService } from './messages/services/message-processing.app.service';
import { InfraestructureModule } from '../infraestructure/infraestructure.module';
import { SpecialtiesAppService } from './specialties/services/specialties.app.service';
import { SpecialtiesAppServiceInterface } from './specialties/interfaces/specialties.app.service.interface';
import { UserSpecialtyRegistrationService } from './specialties/services/user-specialty-registration.service';
import { ServiceRequestAppService } from './service-request/services/service-request.app.service';
import { ServiceRequestAppServiceInterface } from './service-request/interfaces/service-request.app.service.interfaces';
import { ServiceRequestProposalAppService } from './service-request/services/service-request-proposal.app.service';
import { ServiceRequestProposalAppServiceInterface } from './service-request/interfaces/service-request-proposal.app.service.interface';

// Event-Driven Architecture
import { EventsModule } from './events/events.module';

// Validadores
import { EmailValidator } from './messages/services/validators/email.validator';
import { PostalCodeValidator } from './messages/services/validators/postal-code.validator';
import { StateValidator } from './messages/services/validators/state.validator';
// NumberValidator não é provider - usa factory methods estáticos
import { PhoneValidator } from './messages/services/validators/phone.validator';

// Formatadores
import { MenuMessageFormatter } from './messages/services/formatters/menu-message.formatter';
import { ProfileMessageFormatter } from './messages/services/formatters/profile-message.formatter';
import { RegistrationMessageFormatter } from './messages/services/formatters/registration-message.formatter';
import { SpecialtyMessageFormatter } from './messages/services/formatters/specialty-message.formatter';
import { ServiceRequestRegistrationMessageFormatter } from './messages/services/formatters/service-request-registration-message.formatter';
import { ServiceRequestViewMessageFormatter } from './messages/services/formatters/service-request-view-message.formatter';
import { ProfessionalServiceRequestFormatter } from './messages/services/formatters/professional-service-request.formatter';
import { ClientProposalMessageFormatter } from './messages/services/formatters/client-proposal-message.formatter';

// Handlers
import {
  MenuCommandHandler,
  ProfileDisplayHandler,
  WelcomeMessageHandler,
  InitiateRegistrationHandler,
  InitiateSpecialtyHandler,
  InitiateServiceRequestHandler,
  ViewServiceRequestsHandler,
  ViewAvailableServiceRequestsHandler,
  ViewAcceptedServiceRequestsHandler,
  UserRegistrationFlowHandler,
  SpecialtyRegistrationFlowHandler,
  ServiceRequestRegistrationFlowHandler,
  ServiceRequestViewFlowHandler,
  AvailableServiceRequestsFlowHandler,
  AcceptedServiceRequestsFlowHandler,
  FallbackMessageHandler,
} from './messages/services/handlers';
import { ClientProposalViewFlowHandler } from './messages/services/handlers/client-proposal-view-flow.handler';

// Router
import { MessageRouter } from './messages/services/routers/message-router.service';

const services: Provider[] = [
  {
    provide: SpecialtiesAppServiceInterface,
    useClass: SpecialtiesAppService,
  },
  {
    provide: ServiceRequestAppServiceInterface,
    useClass: ServiceRequestAppService,
  },
  {
    provide: ServiceRequestProposalAppServiceInterface,
    useClass: ServiceRequestProposalAppService,
  },
];

const validators: Provider[] = [
  EmailValidator,
  PostalCodeValidator,
  StateValidator,
  PhoneValidator,
  // NumberValidator não é provider - usa factory methods estáticos
];

const formatters: Provider[] = [
  MenuMessageFormatter,
  ProfileMessageFormatter,
  RegistrationMessageFormatter,
  SpecialtyMessageFormatter,
  ServiceRequestRegistrationMessageFormatter,
  ServiceRequestViewMessageFormatter,
  ProfessionalServiceRequestFormatter,
  ClientProposalMessageFormatter,
];

const handlers: Provider[] = [
  MenuCommandHandler,
  ProfileDisplayHandler,
  WelcomeMessageHandler,
  InitiateRegistrationHandler,
  InitiateSpecialtyHandler,
  InitiateServiceRequestHandler,
  ViewServiceRequestsHandler,
  ViewAvailableServiceRequestsHandler,
  ViewAcceptedServiceRequestsHandler,
  UserRegistrationFlowHandler,
  SpecialtyRegistrationFlowHandler,
  ServiceRequestRegistrationFlowHandler,
  ServiceRequestViewFlowHandler,
  AvailableServiceRequestsFlowHandler,
  AcceptedServiceRequestsFlowHandler,
  ClientProposalViewFlowHandler,
  FallbackMessageHandler,
];

@Module({
  imports: [
    DomainModule,
    InfraestructureModule,
    EventsModule, // Event-Driven Architecture
  ],
  providers: [
    UserRegistrationService,
    UserSpecialtyRegistrationService,
    ConversationStateAppService,
    MessageProcessingAppService,
    MessageRouter,
    ...services,
    ...validators,
    ...formatters,
    ...handlers,
  ],
  exports: [
    UserRegistrationService,
    UserSpecialtyRegistrationService,
    ConversationStateAppService,
    MessageProcessingAppService,
    MessageRouter,
    SpecialtiesAppServiceInterface,
    EventsModule,
  ],
})
export class ApplicationModule {}
