import { Injectable, Inject, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { MenuMessageFormatter } from '../formatters/menu-message.formatter';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UnregisteredMenuOption } from '../enums/menu-option.enum';

/**
 * Handler para mensagens de boas-vindas e retorno
 * Processa mensagens iniciais de usuários novos e cadastrados
 */
@Injectable()
export class WelcomeMessageHandler implements ICommandHandler {
  private readonly logger = new Logger(WelcomeMessageHandler.name);

  constructor(
    private readonly menuFormatter: MenuMessageFormatter,
    private readonly whatsappService: WhatsappWebService,
  ) {}

  getHandlerName(): string {
    return 'WelcomeMessageHandler';
  }

  getCommands(): string[] {
    return ['oi', 'olá', 'ola', 'hello', 'hi', 'iniciar', 'começar', 'comecar'];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    if (state && state.state !== 'idle') return false;

    const lowerBody = messageBody.toLowerCase().trim();
    return this.getCommands().some((cmd) => lowerBody.includes(cmd));
  }

  canExecute(user: User | null, command: string): boolean {
    return true;
  }

  async execute(command: string, user: User | null, args?: Record<string, any>): Promise<string> {
    if (user) {
      // Usuário já cadastrado - welcome back
      return this.menuFormatter.formatWelcomeBackMessage(user.getName());
    } else {
      // Usuário novo - welcome inicial
      return this.menuFormatter.formatWelcomeMessage();
    }
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    this.logger.log(`Sending welcome message to ${message.phoneNumber}`);

    const response = await this.execute(message.body, user);
    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, response);

    // Se usuário não cadastrado, define estado para aguardar tipo de serviço
    if (!user) {
      return {
        userId: message.phoneNumber,
        state: 'waiting_service_type',
        data: {},
      };
    }

    // Usuário já cadastrado - sem mudança de estado
    return null;
  }
}
