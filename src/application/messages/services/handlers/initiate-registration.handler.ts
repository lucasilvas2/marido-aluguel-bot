import { Injectable, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { MenuMessageFormatter } from '../formatters/menu-message.formatter';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UnregisteredMenuOption } from '../enums/menu-option.enum';

/**
 * Handler para iniciar cadastro de usuários não registrados
 * Captura comando "1" ou "fazer cadastro" para iniciar fluxo de registro
 */
@Injectable()
export class InitiateRegistrationHandler implements ICommandHandler {
  private readonly logger = new Logger(InitiateRegistrationHandler.name);

  constructor(
    private readonly menuFormatter: MenuMessageFormatter,
    private readonly whatsappService: WhatsappWebService,
  ) {}

  getHandlerName(): string {
    return 'InitiateRegistrationHandler';
  }

  getCommands(): string[] {
    return [
      UnregisteredMenuOption.FAZER_CADASTRO,
      'cadastro',
      'registrar',
      'cadastrar',
      'fazer cadastro',
    ];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    // Apenas para usuários não cadastrados
    if (user) return false;

    // Não inicia se já está em um fluxo
    if (state && state.state !== 'idle') return false;

    const lowerBody = messageBody.toLowerCase().trim();
    
    // Verifica se é o comando "1" ou palavras-chave de cadastro
    return (
      lowerBody === UnregisteredMenuOption.FAZER_CADASTRO ||
      this.getCommands().some((cmd) => lowerBody.includes(cmd.toLowerCase()))
    );
  }

  canExecute(user: User | null, command: string): boolean {
    // Apenas usuários não cadastrados podem executar
    return user === null;
  }

  async execute(command: string, user: User | null, args?: Record<string, any>): Promise<string> {
    return this.menuFormatter.formatWelcomeMessage();
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    this.logger.log(
      `Initiating registration flow for new user ${message.phoneNumber}`,
    );

    // Envia mensagem de boas-vindas com opções de cadastro
    const welcomeMessage = this.menuFormatter.formatWelcomeMessage();
    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      welcomeMessage,
    );

    // Define estado para aguardar seleção de tipo de usuário
    return {
      userId: message.phoneNumber,
      state: 'waiting_service_type',
      data: {},
    };
  }
}
