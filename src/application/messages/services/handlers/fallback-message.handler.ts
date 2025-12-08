import { Injectable, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { MenuMessageFormatter } from '../formatters/menu-message.formatter';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';

/**
 * Handler fallback para mensagens não reconhecidas
 * Responde com mensagem de ajuda quando nenhum outro handler pode processar
 */
@Injectable()
export class FallbackMessageHandler implements ICommandHandler {
  private readonly logger = new Logger(FallbackMessageHandler.name);

  constructor(
    private readonly menuFormatter: MenuMessageFormatter,
    private readonly whatsappService: WhatsappWebService,
  ) {}

  getHandlerName(): string {
    return 'FallbackMessageHandler';
  }

  getCommands(): string[] {
    return ['*']; // Aceita qualquer comando
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    // Este handler sempre pode processar (é o fallback)
    // Mas só será chamado se nenhum outro handler processar
    return true;
  }

  canExecute(user: User | null, command: string): boolean {
    return true;
  }

  async execute(command: string, user: User | null, args?: Record<string, any>): Promise<string> {
    this.logger.debug(`Fallback handler triggered for unrecognized message: ${command}`);
    return this.menuFormatter.formatInvalidOptionMessage();
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    this.logger.log(`Fallback handler processing message from ${message.phoneNumber}`);

    const response = await this.execute(message.body, user);
    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, response);

    // Fallback não altera estado
    return null;
  }
}
