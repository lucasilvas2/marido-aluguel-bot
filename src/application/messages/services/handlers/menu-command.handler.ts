import { Injectable, Inject, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { MenuMessageFormatter } from '../formatters/menu-message.formatter';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { MenuOption } from '../enums/menu-option.enum';

/**
 * Handler para comandos de menu e ajuda
 * Processa comandos únicos que exibem menus
 */
@Injectable()
export class MenuCommandHandler implements ICommandHandler {
  private readonly logger = new Logger(MenuCommandHandler.name);

  constructor(
    private readonly menuFormatter: MenuMessageFormatter,
    private readonly whatsappService: WhatsappWebService,
  ) {}

  getHandlerName(): string {
    return 'MenuCommandHandler';
  }

  getCommands(): string[] {
    return ['menu', 'ajuda', 'help', MenuOption.MENU, '0'];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    const lowerBody = messageBody.toLowerCase().trim();
    
    // Menu/Ajuda podem ser chamados a qualquer momento (permite cancelamento de fluxos)
    // Mas verifica correspondência exata para números para evitar falsos positivos
    return this.getCommands().some((cmd) => {
      const lowerCmd = cmd.toLowerCase();
      // Para números (como '0'), verifica correspondência exata
      if (/^\d+$/.test(lowerCmd)) {
        return lowerBody === lowerCmd;
      }
      // Para palavras, permite includes
      return lowerBody === lowerCmd || lowerBody.includes(lowerCmd);
    });
  }

  canExecute(user: User | null, command: string): boolean {
    // Menu está disponível para todos (cadastrados ou não)
    return true;
  }

  async execute(command: string, user: User | null, args?: Record<string, any>): Promise<string> {
    this.logger.debug(`Executing menu command for user: ${user?.getId() || 'guest'}`);
    return this.menuFormatter.formatMainMenu(user);
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    this.logger.log(`Handling menu command for ${message.phoneNumber}`);

    const response = await this.execute(message.body, user);
    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, response);

    // Menu não altera estado da conversa
    return null;
  }
}
