import { Injectable, Logger } from '@nestjs/common';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { IConversationHandler } from '../handlers/interfaces/conversation-handler.interface';
import { MenuCommandHandler } from '../handlers/menu-command.handler';
import { ProfileDisplayHandler } from '../handlers/profile-display.handler';
import { WelcomeMessageHandler } from '../handlers/welcome-message.handler';
import { InitiateRegistrationHandler } from '../handlers/initiate-registration.handler';
import { InitiateSpecialtyHandler } from '../handlers/initiate-specialty.handler';
import { InitiateServiceRequestHandler } from '../handlers/initiate-service-request.handler';
import { ViewServiceRequestsHandler } from '../handlers/view-service-requests.handler';
import { ViewAvailableServiceRequestsHandler } from '../handlers/view-available-service-requests.handler';
import { ViewAcceptedServiceRequestsHandler } from '../handlers/view-accepted-service-requests.handler';
import { UserRegistrationFlowHandler } from '../handlers/user-registration-flow.handler';
import { SpecialtyRegistrationFlowHandler } from '../handlers/specialty-registration-flow.handler';
import { ServiceRequestRegistrationFlowHandler } from '../handlers/service-request-registration-flow.handler';
import { ServiceRequestViewFlowHandler } from '../handlers/service-request-view-flow.handler';
import { AvailableServiceRequestsFlowHandler } from '../handlers/available-service-requests-flow.handler';
import { AcceptedServiceRequestsFlowHandler } from '../handlers/accepted-service-requests-flow.handler';
import { FallbackMessageHandler } from '../handlers/fallback-message.handler';

/**
 * Router central para delegação de mensagens aos handlers apropriados
 * Implementa Chain of Responsibility Pattern
 */
@Injectable()
export class MessageRouter {
  private readonly logger = new Logger(MessageRouter.name);
  private readonly handlers: IConversationHandler[];

  constructor(
    // Command Handlers
    private readonly menuHandler: MenuCommandHandler,
    private readonly profileHandler: ProfileDisplayHandler,
    private readonly welcomeHandler: WelcomeMessageHandler,
    private readonly initiateRegistrationHandler: InitiateRegistrationHandler,
    private readonly initiateSpecialtyHandler: InitiateSpecialtyHandler,
    private readonly initiateServiceRequestHandler: InitiateServiceRequestHandler,
    private readonly viewServiceRequestsHandler: ViewServiceRequestsHandler,
    private readonly viewAvailableServiceRequestsHandler: ViewAvailableServiceRequestsHandler,
    private readonly viewAcceptedServiceRequestsHandler: ViewAcceptedServiceRequestsHandler,
    // Flow Handlers
    private readonly userRegistrationHandler: UserRegistrationFlowHandler,
    private readonly specialtyRegistrationHandler: SpecialtyRegistrationFlowHandler,
    private readonly serviceRequestRegistrationHandler: ServiceRequestRegistrationFlowHandler,
    private readonly serviceRequestViewFlowHandler: ServiceRequestViewFlowHandler,
    private readonly availableServiceRequestsFlowHandler: AvailableServiceRequestsFlowHandler,
    private readonly acceptedServiceRequestsFlowHandler: AcceptedServiceRequestsFlowHandler,
    // Fallback
    private readonly fallbackHandler: FallbackMessageHandler,
  ) {
    this.handlers = [
      // Comandos específicos (alta prioridade)
      this.menuHandler,
      this.profileHandler,
      this.initiateRegistrationHandler,
      this.initiateSpecialtyHandler,
      this.initiateServiceRequestHandler,
      this.viewServiceRequestsHandler,
      this.viewAvailableServiceRequestsHandler,
      this.viewAcceptedServiceRequestsHandler,
      
      // Fluxos ativos (verificam estado)
      this.userRegistrationHandler,
      this.specialtyRegistrationHandler,
      this.serviceRequestRegistrationHandler,
      this.serviceRequestViewFlowHandler,
      this.availableServiceRequestsFlowHandler,
      this.acceptedServiceRequestsFlowHandler,
      
      // Welcome (saudações genéricas)
      this.welcomeHandler,
      
      // Fallback (sempre aceita, deve ser o último)
      this.fallbackHandler,
    ];
  }

  /**
   * Roteia mensagem para o handler apropriado
   * @param message Mensagem recebida
   * @param state Estado atual da conversa
   * @param user Usuário (se cadastrado)
   * @returns Novo estado da conversa ou null
   */
  async route(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    this.logger.debug(
      `Routing message from ${message.phoneNumber}, state: ${state?.state || 'none'}, user: ${user ? user.getId() : 'none'}`,
    );

    // Percorre handlers até encontrar um que possa processar
    for (const handler of this.handlers) {
      try {
        const canHandle = await handler.canHandle(state, user, message.body);

        if (canHandle) {
          this.logger.log(
            `Handler selected: ${handler.getHandlerName()} for message from ${message.phoneNumber}`,
          );

          const newState = await handler.handle(message, state, user);

          this.logger.debug(
            `Handler ${handler.getHandlerName()} returned new state: ${newState?.state || 'null'}`,
          );

          return newState;
        }
      } catch (error) {
        this.logger.error(
          `Error in handler ${handler.getHandlerName()} for message from ${message.phoneNumber}:`,
          error,
        );

        continue;
      }
    }

    this.logger.warn(`No handler found for message from ${message.phoneNumber} (fallback should have caught it)`);
    return null;
  }

  /**
   * Registra um novo handler dinamicamente (para extensibilidade)
   * @param handler Handler a ser registrado
   * @param position Posição na cadeia (padrão: antes do fallback)
   */
  registerHandler(handler: IConversationHandler, position?: number): void {
    const insertPosition = position !== undefined ? position : this.handlers.length - 1;
    this.handlers.splice(insertPosition, 0, handler);
    this.logger.log(`Handler ${handler.getHandlerName()} registered at position ${insertPosition}`);
  }

  /**
   * Remove um handler da cadeia
   * @param handlerName Nome do handler a remover
   */
  unregisterHandler(handlerName: string): boolean {
    const index = this.handlers.findIndex((h) => h.getHandlerName() === handlerName);
    
    if (index !== -1) {
      this.handlers.splice(index, 1);
      this.logger.log(`Handler ${handlerName} unregistered`);
      return true;
    }

    this.logger.warn(`Handler ${handlerName} not found for unregistration`);
    return false;
  }

  /**
   * Retorna lista de handlers registrados (para debugging)
   */
  getRegisteredHandlers(): string[] {
    return this.handlers.map((h) => h.getHandlerName());
  }
}
