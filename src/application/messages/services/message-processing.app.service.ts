import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { ConversationStateAppService } from './conversation-state.app.service';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { ConversationMessageDTO } from '../dtos/conversation-message.dto';
import { MessageRouter } from './routers/message-router.service';

@Injectable()
export class MessageProcessingAppService implements OnModuleInit {
  private readonly logger = new Logger(MessageProcessingAppService.name);
  
  constructor(
    private readonly whatsappWebService: WhatsappWebService,
    private readonly conversationStateAppService: ConversationStateAppService,
    private readonly messageRouter: MessageRouter,
    @Inject(UsersServiceInterface)
    private readonly usersService: UsersServiceInterface,
  ) {}

  async onModuleInit() {
    this.logger.log('Message Processing Service initialized');
    await this.startListening();
  }

  /**
   * Verifica se o número de telefone está na lista de números permitidos
   * Em ambiente de desenvolvimento, se DEV_ALLOWED_NUMBERS estiver configurado,
   * apenas os números na lista poderão interagir com o bot
   * 
   * @param phoneNumber Número de telefone sem o sufixo @c.us
   * @returns true se o número é permitido ou se não há restrição configurada
   */
  private isPhoneNumberAllowed(phoneNumber: string): boolean {
    const allowedNumbers = process.env.DEV_ALLOWED_NUMBERS;
    
    // Se não houver restrição configurada, permite todos
    if (!allowedNumbers || allowedNumbers.trim() === '') {
      return true;
    }

    // Converte a string CSV em array e remove espaços
    const allowedList = allowedNumbers
      .split(',')
      .map(num => num.trim())
      .filter(num => num.length > 0);

    // Se a lista estiver vazia após o processamento, permite todos
    if (allowedList.length === 0) {
      return true;
    }

    // Verifica se o número está na lista
    const isAllowed = allowedList.includes(phoneNumber);
    
    if (!isAllowed) {
      this.logger.debug(
        `Dev restriction active - Allowed numbers: [${allowedList.join(', ')}]`
      );
    }

    return isAllowed;
  }

  /**
   * Inicia listener de mensagens do WhatsApp
   * Registra callback para processar cada mensagem recebida
   */
  private async startListening(): Promise<void> {
    await this.whatsappWebService.listenToMessages(async (message: any) => {
      try {
        await this.processMessage(message);
      } catch (error) {
        this.logger.error(`Error processing message: ${error.message}`, error.stack);
      }
    });
    this.logger.log('📱 WhatsApp message listener registered');
  }

  /**
   * Processa mensagem recebida do WhatsApp
   * 
   * Fluxo:
   * 1. Extrai dados da mensagem
   * 2. Converte para DTO tipado
   * 3. Busca contexto (estado e usuário)
   * 4. Delega para MessageRouter
   * 5. Atualiza estado
   * 
   * Suporta duas assinaturas para compatibilidade com testes:
   * - processMessage({ from, body, timestamp }) - preferida
   * - processMessage(phoneNumber, body) - legado
   * 
   * @param message Mensagem do WhatsApp ou telefone (string)
   * @param maybeBody Corpo da mensagem (apenas para assinatura legado)
   */
  async processMessage(message: any, maybeBody?: any): Promise<void> {
    let from: string | undefined;
    let body: string | undefined;
    let timestamp: number | undefined;

    if (typeof message === 'string') {
      from = message.includes('@') ? message : `${message}@c.us`;
      body = maybeBody;
      timestamp = Date.now();
    } else {
      ({ from, body, timestamp } = message || {});
    }

    const phoneNumber = (from || '').replace('@c.us', '');

    // Verificação de limitação de números em desenvolvimento
    if (!this.isPhoneNumberAllowed(phoneNumber)) {
      this.logger.debug(`🚫 Number ${phoneNumber} not in allowed list - ignoring message`);
      return;
    }

    this.logger.log(`📨 Processing message from ${phoneNumber}: ${body}`);

    try {
      const messageDto: ConversationMessageDTO = {
        phoneNumber,
        body: body || '',
        timestamp: timestamp || Date.now(),
        messageId: message?.id,
        fromMe: message?.fromMe || false,
      };

      const state = this.conversationStateAppService.getState(phoneNumber);

      const user = await this.usersService.findByPhone(phoneNumber);

      this.logger.debug(
        `Context - User: ${user ? user.getId() : 'none'}, State: ${state?.state || 'none'}`
      );

      const newState = await this.messageRouter.route(messageDto, state, user);

      if (newState) {
        this.conversationStateAppService.setState(phoneNumber, newState.state, newState.data);
        this.logger.debug(`✅ State updated to: ${newState.state}`);
      } else {
        this.conversationStateAppService.clearState(phoneNumber);
        this.logger.debug(`🧹 State cleared`);
      }
    } catch (error) {
      this.logger.error(`❌ Error processing message from ${phoneNumber}:`, error);
      
      try {
        await this.whatsappWebService.sendMessage(
          `${phoneNumber}@c.us`,
          '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente ou digite *menu* para ver as opções.'
        );
      } catch (sendError) {
        this.logger.error(`Failed to send error message to ${phoneNumber}:`, sendError);
      }

      this.conversationStateAppService.clearState(phoneNumber);
    }
  }
}
