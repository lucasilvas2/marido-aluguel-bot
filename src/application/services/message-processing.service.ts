import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UserRegistrationService } from './user-registration.service';
import { ConversationStateService } from './conversation-state.service';

@Injectable()
export class MessageProcessingService implements OnModuleInit {
  private readonly logger = new Logger(MessageProcessingService.name);

  constructor(
    private readonly whatsappWebService: WhatsappWebService,
    private readonly userRegistrationService: UserRegistrationService,
    private readonly conversationStateService: ConversationStateService,
  ) {}

  async onModuleInit() {
    this.logger.log('Message Processing Service initialized');
    await this.startListening();
  }

  private async startListening(): Promise<void> {
    await this.whatsappWebService.listenToMessages(async (message: any) => {
      try {
        await this.processMessage(message);
      } catch (error) {
        this.logger.error(`Error processing message: ${error.message}`, error.stack);
      }
    });
    this.logger.log('WhatsApp message listener registered');
  }

  async processMessage(message: any, maybeBody?: any): Promise<void> {
    // Support both signatures:
    // - processMessage({ from, body, timestamp })  (preferred)
    // - processMessage(phoneNumber, body)           (legacy tests)
    let from: string | undefined;
    let body: string | undefined;
    let timestamp: number | undefined;

    if (typeof message === 'string') {
      // legacy call: message is phone number (without @c.us in tests)
      from = message.includes('@') ? message : `${message}@c.us`;
      body = maybeBody;
      timestamp = Date.now();
    } else {
      ({ from, body, timestamp } = message || {});
    }

    // Remove @c.us para obter apenas o número
    const phoneNumber = (from || '').replace('@c.us', '');

    this.logger.log(`Processing message from ${phoneNumber}: ${body}`);

    try {
      // Verifica o estado atual da conversa
      const conversationState = this.conversationStateService.getState(phoneNumber);

      if (!conversationState || conversationState.state === 'idle') {
        await this.handleInitialContact(phoneNumber, body);
      } else {
        await this.handleConversationFlow(phoneNumber, body, conversationState);
      }
    } catch (error) {
      this.logger.error(`Error handling message from ${phoneNumber}`, error);
      await this.sendMessage(
        from,
        'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
      );
    }
  }

  private async handleInitialContact(phoneNumber: string, body: string): Promise<void> {
    const lowerBody = body.toLowerCase().trim();

    if (lowerBody.includes('olá') || lowerBody.includes('oi') || lowerBody === 'iniciar') {
      await this.sendWelcomeMessage(phoneNumber);
      this.conversationStateService.setState(phoneNumber, 'waiting_service_type');
    } else if (lowerBody.includes('ajuda') || lowerBody === 'menu') {
      await this.sendHelpMessage(phoneNumber);
    } else {
      await this.sendWelcomeMessage(phoneNumber);
      this.conversationStateService.setState(phoneNumber, 'waiting_service_type');
    }
  }

  private async handleConversationFlow(
    phoneNumber: string,
    body: string,
    conversationState: any
  ): Promise<void> {
    const { state, data } = conversationState;

    switch (state) {
      case 'waiting_service_type':
        await this.handleServiceTypeSelection(phoneNumber, body);
        break;
      case 'waiting_user_info':
        await this.handleUserInfoCollection(phoneNumber, body, data);
        break;
      case 'waiting_address':
        await this.handleAddressCollection(phoneNumber, body, data);
        break;
      case 'waiting_service_details':
        await this.handleServiceDetails(phoneNumber, body, data);
        break;
      default:
        await this.sendMessage(
          `${phoneNumber}@c.us`,
          'Desculpe, não entendi. Digite "menu" para ver as opções disponíveis.'
        );
        this.conversationStateService.clearState(phoneNumber);
    }
  }

  private async handleServiceTypeSelection(phoneNumber: string, body: string): Promise<void> {
    const lowerBody = body.toLowerCase().trim();

    if (lowerBody.includes('1') || lowerBody.includes('cliente')) {
      this.conversationStateService.setState(phoneNumber, 'waiting_user_info', {
        userType: 'CLIENT'
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '✅ Ótimo! Vou te ajudar a se cadastrar como cliente.\n\nPor favor, me informe seu nome completo:'
      );
    } else if (lowerBody.includes('2') || lowerBody.includes('profissional')) {
      this.conversationStateService.setState(phoneNumber, 'waiting_user_info', {
        userType: 'PROFESSIONAL'
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '✅ Ótimo! Vou te ajudar a se cadastrar como profissional.\n\nPor favor, me informe seu nome completo:'
      );
    } else {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Opção inválida. Por favor, escolha:\n1 - Cliente\n2 - Profissional'
      );
    }
  }

  private async handleUserInfoCollection(
    phoneNumber: string,
    body: string,
    data: any
  ): Promise<void> {
    if (!data.name) {
      this.conversationStateService.setState(phoneNumber, 'waiting_user_info', {
        ...data,
        name: body.trim()
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        `Prazer, ${body.trim()}! 😊\n\nAgora, me informe seu email:`
      );
    } else if (!data.email) {
      const email = body.trim().toLowerCase();
      
      if (!this.isValidEmail(email)) {
        await this.sendMessage(
          `${phoneNumber}@c.us`,
          '❌ Email inválido. Por favor, informe um email válido:'
        );
        return;
      }

      this.conversationStateService.setState(phoneNumber, 'waiting_address', {
        ...data,
        email
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Perfeito! 📧\n\nAgora preciso do seu endereço.\nPor favor, me informe o CEP:'
      );
    }
  }

  private async handleAddressCollection(
    phoneNumber: string,
    body: string,
    data: any
  ): Promise<void> {
    const addressData = data.address || {};

    if (!addressData.postalCode) {
      const postalCode = body.trim().replace(/\D/g, '');
      
      if (postalCode.length !== 8) {
        await this.sendMessage(
          `${phoneNumber}@c.us`,
          '❌ CEP inválido. Por favor, informe um CEP válido com 8 dígitos:'
        );
        return;
      }

      this.conversationStateService.setState(phoneNumber, 'waiting_address', {
        ...data,
        address: { ...addressData, postalCode }
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Ótimo! 📍\n\nAgora me informe a rua:'
      );
    } else if (!addressData.street) {
      this.conversationStateService.setState(phoneNumber, 'waiting_address', {
        ...data,
        address: { ...addressData, street: body.trim() }
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Perfeito! Agora me informe o número:'
      );
    } else if (!addressData.number) {
      this.conversationStateService.setState(phoneNumber, 'waiting_address', {
        ...data,
        address: { ...addressData, number: body.trim() }
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Ok! Me informe o bairro:'
      );
    } else if (!addressData.neighborhood) {
      this.conversationStateService.setState(phoneNumber, 'waiting_address', {
        ...data,
        address: { ...addressData, neighborhood: body.trim() }
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Ótimo! Agora a cidade:'
      );
    } else if (!addressData.city) {
      this.conversationStateService.setState(phoneNumber, 'waiting_address', {
        ...data,
        address: { ...addressData, city: body.trim() }
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Quase lá! Por fim, me informe o estado (UF):'
      );
    } else if (!addressData.state) {
      const state = body.trim().toUpperCase();
      
      if (state.length !== 2) {
        await this.sendMessage(
          `${phoneNumber}@c.us`,
          '❌ Estado inválido. Por favor, informe a sigla do estado (ex: SP, RJ):'
        );
        return;
      }

      const finalData = {
        ...data,
        address: { ...addressData, state }
      };

      try {
        await this.registerUser(phoneNumber, finalData);
      } catch (error) {
        this.logger.error(`Error registering user ${phoneNumber}`, error);
        if (error && (error.code === 'P2002' || (error.meta && error.meta.target && error.meta.target.includes('User_phone_key')))) {
          await this.sendMessage(
            `${phoneNumber}@c.us`,
            '❌ Já existe um cadastro com este telefone. Se for você, digite "menu" para ver opções ou entre em contato com o suporte.'
          );
        } else {
          await this.sendMessage(
            `${phoneNumber}@c.us`,
            '❌ Ocorreu um erro ao realizar seu cadastro. Por favor, tente novamente mais tarde.'
          );
        }
        this.conversationStateService.clearState(phoneNumber);
      }
    }
  }

  private async handleServiceDetails(
    phoneNumber: string,
    body: string,
    data: any
  ): Promise<void> {
    await this.sendMessage(
      `${phoneNumber}@c.us`,
      '🚧 Funcionalidade de solicitação de serviço em desenvolvimento...'
    );
    this.conversationStateService.clearState(phoneNumber);
  }

  private async registerUser(phoneNumber: string, data: any): Promise<void> {
    const userData = {
      name: data.name,
      email: data.email,
      phone: phoneNumber,
      userType: data.userType,
    };

    const addressData = {
      street: data.address.street,
      number: data.address.number,
      neighborhood: data.address.neighborhood,
      city: data.address.city,
      state: data.address.state,
      postalCode: data.address.postalCode,
      complement: data.address.complement || null,
    };

    await this.userRegistrationService.registerUser(userData, addressData);

    await this.sendMessage(
      `${phoneNumber}@c.us`,
      `✅ Cadastro realizado com sucesso!\n\n` +
      `📋 Seus dados:\n` +
      `Nome: ${userData.name}\n` +
      `Email: ${userData.email}\n` +
      `Telefone: ${userData.phone}\n` +
      `Tipo: ${userData.userType === 'CLIENT' ? 'Cliente' : 'Profissional'}\n\n` +
      `Você já pode solicitar serviços! Digite "menu" para ver as opções.`
    );

    this.conversationStateService.clearState(phoneNumber);
  }

  private async sendWelcomeMessage(phoneNumber: string): Promise<void> {
    const welcomeText = 
      '👋 Olá! Bem-vindo ao Marido de Aluguel!\n\n' +
      'Sou seu assistente virtual e vou te ajudar.\n\n' +
      'Para começar, me diga:\n' +
      '1️⃣ - Quero me cadastrar como CLIENTE\n' +
      '2️⃣ - Quero me cadastrar como PROFISSIONAL\n\n' +
      'Digite o número da opção desejada.';

    await this.sendMessage(`${phoneNumber}@c.us`, welcomeText);
  }

  private async sendHelpMessage(phoneNumber: string): Promise<void> {
    const helpText = 
      '📋 MENU DE AJUDA\n\n' +
      'Comandos disponíveis:\n' +
      '• "iniciar" - Iniciar cadastro\n' +
      '• "menu" - Ver este menu\n' +
      '• "ajuda" - Obter ajuda\n\n' +
      'Como posso te ajudar?';

    await this.sendMessage(`${phoneNumber}@c.us`, helpText);
  }

  private async sendMessage(to: string, message: string): Promise<void> {
    try {
      await this.whatsappWebService.sendMessage(to, message);
    } catch (error) {
      this.logger.error(`Failed to send message to ${to}`, error);
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}