import { Injectable, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { ServiceRequestRegistrationFlowHandler } from './service-request-registration-flow.handler';
import { ClientMenuOption } from '../enums/menu-option.enum';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';

/**
 * Handler para iniciar o fluxo de solicitação de serviço
 * Processa o comando quando cliente escolhe "Solicitar Serviço" no menu
 */
@Injectable()
export class InitiateServiceRequestHandler implements ICommandHandler {
  private readonly logger = new Logger(InitiateServiceRequestHandler.name);

  constructor(
    private readonly serviceRequestFlowHandler: ServiceRequestRegistrationFlowHandler,
  ) {}

  getHandlerName(): string {
    return 'InitiateServiceRequestHandler';
  }

  getCommands(): string[] {
    return [ClientMenuOption.SOLICITAR_SERVICO, 'solicitar', 'solicitar serviço', 'serviço'];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    // Apenas clientes registrados podem solicitar serviços
    if (!user) return false;
    
    // Verifica se é um cliente
    if (user.getUserType() !== UserType.CLIENT) return false;

    // Não inicia se já está em um fluxo
    if (state && state.state !== 'idle') return false;

    const lowerBody = messageBody.toLowerCase().trim();
    return this.getCommands().some((cmd) => 
      lowerBody === cmd.toLowerCase() || lowerBody.includes(cmd.toLowerCase())
    );
  }

  canExecute(user: User | null, command: string): boolean {
    // Apenas clientes podem executar
    return user !== null && user.getUserType() === UserType.CLIENT;
  }

  async execute(command: string, user: User | null, args?: Record<string, any>): Promise<string> {
    // Não retorna mensagem direta, o fluxo enviará
    return '';
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    if (!user) {
      this.logger.warn(`Non-registered user ${message.phoneNumber} tried to request service`);
      return null;
    }

    this.logger.log(
      `Initiating service request flow for client ${user.getId()} (${message.phoneNumber})`,
    );

    // Delega para o handler de fluxo
    return await this.serviceRequestFlowHandler.startServiceRequestFlow(
      message.phoneNumber,
      user.getName(),
    );
  }
}
