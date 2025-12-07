import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UserRegistrationService } from '../../users/services/user-registration.service';
import { ConversationStateAppService } from './conversation-state.app.service';
import { UserSpecialtyRegistrationService } from '../../specialties/services/user-specialty-registration.service';
import { SpecialtiesServiceInterface } from 'src/domain/specialties/services/specialties.service.interface';
import { UserSpecialtiesServiceInterface } from 'src/domain/specialties/services/user-specialties.service.interface';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { UserType, UserTypeLabel, UserTypeString } from 'src/domain/users/entities/enums/user-type.enum';
import { MenuOption, ProfessionalMenuOption, ClientMenuOption, UnregisteredMenuOption, UserRegistrationOption } from './enums/menu-option.enum';

@Injectable()
export class MessageProcessingAppService implements OnModuleInit {
  private readonly logger = new Logger(MessageProcessingAppService.name);
  
  constructor(
    private readonly whatsappWebService: WhatsappWebService,
    private readonly userRegistrationService: UserRegistrationService,
    private readonly conversationStateAppService: ConversationStateAppService,
    private readonly userSpecialtyRegistrationService: UserSpecialtyRegistrationService,
    @Inject(SpecialtiesServiceInterface)
    private readonly specialtiesService: SpecialtiesServiceInterface,
    @Inject(UserSpecialtiesServiceInterface)
    private readonly userSpecialtiesService: UserSpecialtiesServiceInterface,
    @Inject(UsersServiceInterface)
    private readonly usersService: UsersServiceInterface,
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

    const phoneNumber = (from || '').replace('@c.us', '');

    this.logger.log(`Processing message from ${phoneNumber}: ${body}`);

    try {
      // Verifica o estado atual da conversa
      const conversationState = this.conversationStateAppService.getState(phoneNumber);

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

    // Verifica se o usuário já está cadastrado
    const user = await this.usersService.findByPhone(phoneNumber);

    if (user) {
      // Usuário já cadastrado - processar comandos do menu
      const isProfessional = user.getUserType() === UserType.PROFESSIONAL;
      
      if (lowerBody.includes('ajuda') || lowerBody === 'menu' || lowerBody === MenuOption.MENU) {
        await this.sendHelpMessage(phoneNumber);
      } else if (lowerBody === MenuOption.OPTION_ONE || lowerBody === 'especialidades' || lowerBody === 'solicitar') {
        if (isProfessional) {
          await this.initiateSpecialtyRegistration(phoneNumber);
        } else {
          await this.handleServiceDetails(phoneNumber, body, {});
        }
      } else if (lowerBody === MenuOption.OPTION_TWO) {
        await this.handleServiceDetails(phoneNumber, body, {});
      } else if (lowerBody === MenuOption.OPTION_THREE || lowerBody === 'perfil') {
        await this.showUserProfile(phoneNumber, user);
      } else {
        // Primeira mensagem de um usuário já cadastrado
        await this.sendWelcomeBackMessage(phoneNumber, user.getName());
      }
    } else {
      // Usuário não cadastrado - iniciar fluxo de cadastro
      if (lowerBody.includes('olá') || lowerBody.includes('oi') || lowerBody === 'iniciar' || lowerBody === UnregisteredMenuOption.FAZER_CADASTRO) {
        await this.sendWelcomeMessage(phoneNumber);
        this.conversationStateAppService.setState(phoneNumber, 'waiting_service_type');
      } else if (lowerBody.includes('ajuda') || lowerBody === 'menu' || lowerBody === MenuOption.MENU) {
        await this.sendMessage(
          `${phoneNumber}@c.us`,
          '👋 Olá! Vejo que você ainda não tem cadastro.\n\n' +
          'Para começar a usar nossos serviços, digite:\n\n' +
          `${UnregisteredMenuOption.FAZER_CADASTRO}️⃣ - Fazer cadastro\n` +
          `${MenuOption.MENU}️⃣ - Ver menu de ajuda`
        );
      } else {
        await this.sendWelcomeMessage(phoneNumber);
        this.conversationStateAppService.setState(phoneNumber, 'waiting_service_type');
      }
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
      case 'waiting_specialty_selection':
        await this.handleSpecialtySelection(phoneNumber, body, data);
        break;
      case 'waiting_specialty_experience':
        await this.handleSpecialtyExperience(phoneNumber, body, data);
        break;
      case 'waiting_specialty_price':
        await this.handleSpecialtyPrice(phoneNumber, body, data);
        break;
      case 'waiting_specialty_certification':
        await this.handleSpecialtyCertification(phoneNumber, body, data);
        break;
      case 'waiting_specialty_notes':
        await this.handleSpecialtyNotes(phoneNumber, body, data);
        break;
      default:
        await this.sendMessage(
          `${phoneNumber}@c.us`,
          `Desculpe, não entendi. Digite *${MenuOption.MENU}* ou *menu* para ver as opções disponíveis.`
        );
        this.conversationStateAppService.clearState(phoneNumber);
    }
  }

  private async handleServiceTypeSelection(phoneNumber: string, body: string): Promise<void> {
    const lowerBody = body.toLowerCase().trim();

    if (lowerBody.includes(UserRegistrationOption.CLIENTE) || lowerBody.includes('cliente')) {
      this.conversationStateAppService.setState(phoneNumber, 'waiting_user_info', {
        userType: UserTypeString.CLIENT
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '✅ Ótimo! Vou te ajudar a se cadastrar como cliente.\n\nPor favor, me informe seu nome completo:'
      );
    } else if (lowerBody.includes(UserRegistrationOption.PROFISSIONAL) || lowerBody.includes('profissional')) {
      this.conversationStateAppService.setState(phoneNumber, 'waiting_user_info', {
        userType: UserTypeString.PROFESSIONAL
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '✅ Ótimo! Vou te ajudar a se cadastrar como profissional.\n\nPor favor, me informe seu nome completo:'
      );
    } else {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        `❌ Opção inválida. Por favor, escolha:\n${UserRegistrationOption.CLIENTE} - Cliente\n${UserRegistrationOption.PROFISSIONAL} - Profissional`
      );
    }
  }

  private async handleUserInfoCollection(
    phoneNumber: string,
    body: string,
    data: any
  ): Promise<void> {
    if (!data.name) {
      this.conversationStateAppService.setState(phoneNumber, 'waiting_user_info', {
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

      this.conversationStateAppService.setState(phoneNumber, 'waiting_address', {
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

      this.conversationStateAppService.setState(phoneNumber, 'waiting_address', {
        ...data,
        address: { ...addressData, postalCode }
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Ótimo! 📍\n\nAgora me informe a rua:'
      );
    } else if (!addressData.street) {
      this.conversationStateAppService.setState(phoneNumber, 'waiting_address', {
        ...data,
        address: { ...addressData, street: body.trim() }
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Perfeito! Agora me informe o número:'
      );
    } else if (!addressData.number) {
      this.conversationStateAppService.setState(phoneNumber, 'waiting_address', {
        ...data,
        address: { ...addressData, number: body.trim() }
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Ok! Me informe o bairro:'
      );
    } else if (!addressData.neighborhood) {
      this.conversationStateAppService.setState(phoneNumber, 'waiting_address', {
        ...data,
        address: { ...addressData, neighborhood: body.trim() }
      });
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        'Ótimo! Agora a cidade:'
      );
    } else if (!addressData.city) {
      this.conversationStateAppService.setState(phoneNumber, 'waiting_address', {
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
        this.conversationStateAppService.clearState(phoneNumber);
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
    this.conversationStateAppService.clearState(phoneNumber);
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

    const userTypeLabel = userData.userType === UserTypeString.CLIENT ? UserTypeLabel[UserType.CLIENT] : UserTypeLabel[UserType.PROFESSIONAL];
    
    await this.sendMessage(
      `${phoneNumber}@c.us`,
      `✅ Cadastro realizado com sucesso!\n\n` +
      `📋 Seus dados:\n` +
      `Nome: ${userData.name}\n` +
      `Email: ${userData.email}\n` +
      `Telefone: ${userData.phone}\n` +
      `Tipo: ${userTypeLabel}\n\n` +
      `Você já pode usar nossos serviços! Digite *${MenuOption.MENU}* ou *menu* para ver as opções.`
    );

    this.conversationStateAppService.clearState(phoneNumber);
  }

  private async initiateSpecialtyRegistration(phoneNumber: string): Promise<void> {
    const user = await this.usersService.findByPhone(phoneNumber);
    
    if (!user) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Você precisa estar cadastrado para registrar especialidades.\n\nDigite "iniciar" para fazer seu cadastro.'
      );
      return;
    }

    if (user.getUserType() !== UserType.PROFESSIONAL) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Apenas profissionais podem cadastrar especialidades.\n\nSe você é um profissional, entre em contato com o suporte.'
      );
      return;
    }

    const specialties = await this.userSpecialtyRegistrationService.listAvailableSpecialties();
    
    if (specialties.length === 0) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ No momento não há especialidades disponíveis. Entre em contato com o suporte.'
      );
      return;
    }

    const specialtyList = specialties
      .map((s, idx) => `${idx + 1} - ${s.getName()}`)
      .join('\n');
    
    const message = 
      `🔧 *Cadastro de Especialidades*\n\n` +
      `Olá, ${user.getName()}!\n\n` +
      `📋 Especialidades disponíveis:\n${specialtyList}\n\n` +
      `Digite os números das suas especialidades separados por vírgula (ex: 1,3,5)\n\n` +
      `Ou digite *${MenuOption.MENU}* para cancelar e voltar ao menu.`;
    
    await this.sendMessage(`${phoneNumber}@c.us`, message);
    
    this.conversationStateAppService.setState(phoneNumber, 'waiting_specialty_selection', {
      userId: user.getId(),
      userName: user.getName(),
      availableSpecialties: specialties.map(s => ({ id: s.getId(), name: s.getName() }))
    });
  }

  private async handleSpecialtySelection(phoneNumber: string, body: string, data: any): Promise<void> {
    const trimmedBody = body.trim().toLowerCase();
    
    if (trimmedBody === 'cancelar' || trimmedBody === MenuOption.MENU) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        `❌ Cadastro de especialidades cancelado.\n\nDigite *${MenuOption.MENU}* ou *menu* para ver as opções.`
      );
      this.conversationStateAppService.clearState(phoneNumber);
      return;
    }

    // Parse selected specialty numbers
    const selectedNumbers = trimmedBody
      .split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n > 0);

    if (selectedNumbers.length === 0) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Nenhuma especialidade válida foi selecionada.\n\nPor favor, digite os números separados por vírgula (ex: 1,3,5) ou "cancelar".'
      );
      return;
    }

    const availableSpecialties = data.availableSpecialties || [];
    const validSelections = selectedNumbers.filter(n => n <= availableSpecialties.length);

    if (validSelections.length === 0) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        `❌ Números inválidos. Por favor, escolha entre 1 e ${availableSpecialties.length}.`
      );
      return;
    }

    const selectedSpecialtyIds = validSelections.map(n => availableSpecialties[n - 1].id);
    const selectedSpecialtyNames = validSelections.map(n => availableSpecialties[n - 1].name);

    await this.sendMessage(
      `${phoneNumber}@c.us`,
      `✅ Especialidades selecionadas:\n${selectedSpecialtyNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n')}\n\n` +
      `Agora vamos coletar informações sobre cada especialidade.\n\n` +
      `📝 Especialidade 1 de ${selectedSpecialtyIds.length}: ${selectedSpecialtyNames[0]}\n\n` +
      `Quantos anos de experiência você tem? (Digite apenas o número ou "cancelar")`
    );

    this.conversationStateAppService.setState(phoneNumber, 'waiting_specialty_experience', {
      ...data,
      selectedSpecialtyIds,
      selectedSpecialtyNames,
      currentSpecialtyIndex: 0,
      specialtiesData: []
    });
  }

  private async handleSpecialtyExperience(phoneNumber: string, body: string, data: any): Promise<void> {
    const trimmedBody = body.trim().toLowerCase();
    
    if (trimmedBody === 'cancelar' || trimmedBody === MenuOption.MENU) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        `❌ Cadastro de especialidades cancelado.\n\nDigite *${MenuOption.MENU}* ou *menu* para ver as opções.`
      );
      this.conversationStateAppService.clearState(phoneNumber);
      return;
    }

    const experienceYears = parseInt(trimmedBody);
    
    if (isNaN(experienceYears) || experienceYears < 0) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Por favor, digite um número válido de anos de experiência ou "cancelar".'
      );
      return;
    }

    const currentSpecialtyName = data.selectedSpecialtyNames[data.currentSpecialtyIndex];
    
    await this.sendMessage(
      `${phoneNumber}@c.us`,
      `✅ ${experienceYears} anos de experiência registrados.\n\n` +
      `💰 Qual seu preço por hora para ${currentSpecialtyName}?\n` +
      `(Digite apenas o número, ex: 50.00, ou "cancelar")`
    );

    this.conversationStateAppService.setState(phoneNumber, 'waiting_specialty_price', {
      ...data,
      currentExperienceYears: experienceYears
    });
  }

  private async handleSpecialtyPrice(phoneNumber: string, body: string, data: any): Promise<void> {
    const trimmedBody = body.trim().toLowerCase();
    
    if (trimmedBody === 'cancelar' || trimmedBody === MenuOption.MENU) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        `❌ Cadastro de especialidades cancelado.\n\nDigite *${MenuOption.MENU}* ou *menu* para ver as opções.`
      );
      this.conversationStateAppService.clearState(phoneNumber);
      return;
    }

    const pricePerHour = parseFloat(trimmedBody.replace(',', '.'));
    
    if (isNaN(pricePerHour) || pricePerHour < 0) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Por favor, digite um valor válido (ex: 50.00) ou "cancelar".'
      );
      return;
    }

    await this.sendMessage(
      `${phoneNumber}@c.us`,
      `✅ Preço de R$ ${pricePerHour.toFixed(2)}/hora registrado.\n\n` +
      `🎓 Você possui certificação para esta especialidade?\n\n` +
      `Digite:\n1 - Sim\n0 - Não\n\nOu "cancelar" para voltar.`
    );

    this.conversationStateAppService.setState(phoneNumber, 'waiting_specialty_certification', {
      ...data,
      currentPricePerHour: pricePerHour
    });
  }

  private async handleSpecialtyCertification(phoneNumber: string, body: string, data: any): Promise<void> {
    const trimmedBody = body.trim().toLowerCase();
    
    if (trimmedBody === 'cancelar' || trimmedBody === MenuOption.MENU) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        `❌ Cadastro de especialidades cancelado.\n\nDigite *${MenuOption.MENU}* ou *menu* para ver as opções.`
      );
      this.conversationStateAppService.clearState(phoneNumber);
      return;
    }

    let isCertified: boolean;
    
    if (trimmedBody === '1' || trimmedBody === 'sim') {
      isCertified = true;
    } else if (trimmedBody === '0' || trimmedBody === 'não' || trimmedBody === 'nao') {
      isCertified = false;
    } else {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Por favor, digite 1 para Sim, 0 para Não, ou "cancelar".'
      );
      return;
    }

    await this.sendMessage(
      `${phoneNumber}@c.us`,
      `✅ Certificação: ${isCertified ? 'Sim' : 'Não'}\n\n` +
      `📝 Deseja adicionar observações sobre esta especialidade?\n\n` +
      `Digite suas observações ou "pular" para continuar.\n` +
      `Ou "cancelar" para voltar ao menu.`
    );

    this.conversationStateAppService.setState(phoneNumber, 'waiting_specialty_notes', {
      ...data,
      currentIsCertified: isCertified
    });
  }

  private async handleSpecialtyNotes(phoneNumber: string, body: string, data: any): Promise<void> {
    const trimmedBody = body.trim().toLowerCase();
    
    if (trimmedBody === 'cancelar' || trimmedBody === MenuOption.MENU) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        `❌ Cadastro de especialidades cancelado.\n\nDigite *${MenuOption.MENU}* ou *menu* para ver as opções.`
      );
      this.conversationStateAppService.clearState(phoneNumber);
      return;
    }

    const notes = trimmedBody === 'pular' ? undefined : body.trim();

    try {
      await this.userSpecialtyRegistrationService.registerUserSpecialty(
        data.userId,
        data.selectedSpecialtyIds[data.currentSpecialtyIndex],
        data.currentExperienceYears,
        data.currentPricePerHour,
        notes,
        data.currentIsCertified
      );

      const specialtiesData = [...(data.specialtiesData || []), {
        name: data.selectedSpecialtyNames[data.currentSpecialtyIndex],
        experience: data.currentExperienceYears,
        price: data.currentPricePerHour,
        certified: data.currentIsCertified,
        notes: notes
      }];

      const nextIndex = data.currentSpecialtyIndex + 1;
      
      if (nextIndex < data.selectedSpecialtyIds.length) {
        const nextSpecialtyName = data.selectedSpecialtyNames[nextIndex];
        
        await this.sendMessage(
          `${phoneNumber}@c.us`,
          `✅ Especialidade registrada com sucesso!\n\n` +
          `📝 Especialidade ${nextIndex + 1} de ${data.selectedSpecialtyIds.length}: ${nextSpecialtyName}\n\n` +
          `Quantos anos de experiência você tem? (Digite apenas o número ou "cancelar")`
        );

        this.conversationStateAppService.setState(phoneNumber, 'waiting_specialty_experience', {
          ...data,
          currentSpecialtyIndex: nextIndex,
          specialtiesData,
          currentExperienceYears: undefined,
          currentPricePerHour: undefined,
          currentIsCertified: undefined
        });
      } else {
        await this.sendSpecialtyRegistrationSummary(phoneNumber, specialtiesData);
        this.conversationStateAppService.clearState(phoneNumber);
      }
    } catch (error) {
      this.logger.error(`Error registering specialty for user ${data.userId}`, error);
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Ocorreu um erro ao registrar a especialidade. Por favor, tente novamente mais tarde.'
      );
      this.conversationStateAppService.clearState(phoneNumber);
    }
  }

  private async sendSpecialtyRegistrationSummary(phoneNumber: string, specialtiesData: any[]): Promise<void> {
    const summary = specialtiesData.map((s, idx) => 
      `${idx + 1}. ${s.name}\n` +
      `   Experiência: ${s.experience} anos\n` +
      `   Preço/hora: R$ ${s.price.toFixed(2)}\n` +
      `   Certificado: ${s.certified ? 'Sim' : 'Não'}` +
      (s.notes ? `\n   Obs: ${s.notes}` : '')
    ).join('\n\n');

    await this.sendMessage(
      `${phoneNumber}@c.us`,
      `🎉 Todas as especialidades foram cadastradas com sucesso!\n\n` +
      `📋 Resumo:\n\n${summary}\n\n` +
      `Você já pode receber solicitações de serviço!\n\n` +
      `Digite *${MenuOption.MENU}* ou *menu* para ver mais opções.`
    );
  }

  private async listUserSpecialties(phoneNumber: string): Promise<void> {
    const user = await this.usersService.findByPhone(phoneNumber);
    
    if (!user) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Usuário não encontrado. Por favor, faça seu cadastro primeiro.'
      );
      return;
    }

    if (user.getUserType() !== UserType.PROFESSIONAL) {
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Esta funcionalidade está disponível apenas para profissionais.'
      );
      return;
    }

    try {
      const userSpecialties = await this.userSpecialtiesService.findByUserId(user.getId());
      
      if (!userSpecialties || userSpecialties.length === 0) {
        await this.sendMessage(
          `${phoneNumber}@c.us`,
          `🔧 *MINHAS ESPECIALIDADES*\n\n` +
          `Você ainda não possui especialidades cadastradas.\n\n` +
          `Para começar a receber solicitações de serviço, cadastre suas especialidades!\n\n` +
          `Digite *${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES}* para cadastrar agora.`
        );
        return;
      }

      let specialtiesList = `🔧 *MINHAS ESPECIALIDADES*\n\n`;
      specialtiesList += `${user.getName()}, você possui ${userSpecialties.length} especialidade${userSpecialties.length > 1 ? 's' : ''} cadastrada${userSpecialties.length > 1 ? 's' : ''}:\n`;

      const avgPrice = userSpecialties.reduce((sum, us) => sum + (us.getPricePerHour() ?? 0), 0) / userSpecialties.length;
      const totalExperience = userSpecialties.reduce((sum, us) => sum + (us.getExperienceYears() ?? 0), 0);
      const certifiedCount = userSpecialties.filter(us => us.getIsCertified()).length;

      userSpecialties.forEach((us, idx) => {
        const specialtyName = us.getSpecialty()?.getName() || 'N/A';
        const experience = us.getExperienceYears() ?? 0;
        const price = us.getPricePerHour() ?? 0;
        const certified = us.getIsCertified();
        const notes = us.getNotes();
        
        specialtiesList += `\n━━━━━━━━━━━━━━━━━\n`;
        specialtiesList += `*${idx + 1}. ${specialtyName}*\n`;
        specialtiesList += `   💼 ${experience} ${experience === 1 ? 'ano' : 'anos'} de experiência\n`;
        specialtiesList += `   💰 R$ ${price.toFixed(2)}/hora\n`;
        specialtiesList += `   ${certified ? '✅ Certificado' : '⚪ Sem certificação'}\n`;
        
        if (notes && notes.trim()) {
          specialtiesList += `   📝 ${notes}\n`;
        }
      });

      specialtiesList += `\n━━━━━━━━━━━━━━━━━\n`;
      specialtiesList += `\n📊 *Resumo do Perfil:*\n`;
      specialtiesList += `• Experiência Total: ${totalExperience} anos\n`;
      specialtiesList += `• Valor Médio: R$ ${avgPrice.toFixed(2)}/hora\n`;
      specialtiesList += `• Certificações: ${certifiedCount}/${userSpecialties.length}\n`;
      specialtiesList += `\n💡 Digite *${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES}* para adicionar mais especialidades.`;
      specialtiesList += `\nDigite *${MenuOption.MENU}* para voltar ao menu.`;

      await this.sendMessage(`${phoneNumber}@c.us`, specialtiesList);
    } catch (error) {
      this.logger.error(`Error listing user specialties for ${phoneNumber}`, error);
      await this.sendMessage(
        `${phoneNumber}@c.us`,
        '❌ Ocorreu um erro ao buscar suas especialidades. Por favor, tente novamente mais tarde.'
      );
    }
  }

  private async showUserProfile(phoneNumber: string, user: any): Promise<void> {
    const userTypeLabel = UserTypeLabel[user.getUserType() as UserType];
    
    let profileText = 
      `👤 *MEU PERFIL*\n\n` +
      `📝 Nome: ${user.getName()}\n` +
      `📱 Telefone: ${phoneNumber}\n` +
      `👔 Tipo: ${userTypeLabel}\n`;
    
    if (user.getUserType() === UserType.PROFESSIONAL) {
      try {
        this.logger.debug(`Fetching specialties for user ${user.getId()}`);
        const userSpecialties = await this.userSpecialtiesService.findByUserId(user.getId());
        this.logger.debug(`Found ${userSpecialties?.length || 0} specialties for user ${user.getId()}`);
        
        if (userSpecialties && userSpecialties.length > 0) {
          profileText += `\n🔧 *Especialidades Cadastradas* (${userSpecialties.length}):\n`;
          
          userSpecialties.forEach((us, idx) => {
            const specialtyName = us.getSpecialty()?.getName() || 'N/A';
            const experience = us.getExperienceYears() ?? 0;
            const price = us.getPricePerHour() ?? 0;
            const certified = us.getIsCertified() ? '✅ Certificado' : '⚪ Sem certificação';
            const notes = us.getNotes();
            
            profileText += `\n━━━━━━━━━━━━━━━━━\n`;
            profileText += `*${idx + 1}. ${specialtyName}*\n`;
            profileText += `   💼 Experiência: ${experience} ${experience === 1 ? 'ano' : 'anos'}\n`;
            profileText += `   💰 Valor: R$ ${price.toFixed(2)}/hora\n`;
            profileText += `   ${certified}\n`;
            
            if (notes && notes.trim()) {
              profileText += `   📝 Observações: ${notes}\n`;
            }
          });
          
          profileText += `\n━━━━━━━━━━━━━━━━━\n`;
          profileText += `\n💡 *Dica:* Digite *${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES}* para adicionar mais especialidades!`;
        } else {
          profileText += `\n━━━━━━━━━━━━━━━━━\n`;
          profileText += `⚠️ *Você ainda não cadastrou especialidades.*\n\n`;
          profileText += `As especialidades são essenciais para que clientes possam te encontrar e contratar!\n\n`;
          profileText += `📌 Digite *${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES}* para cadastrar agora!`;
        }
      } catch (error) {
        this.logger.error(`Error fetching user specialties for ${user.getId()}:`, error);
        this.logger.error(`Error stack:`, error.stack);
        profileText += `\n━━━━━━━━━━━━━━━━━\n`;
        profileText += `\n⚠️ Não foi possível carregar suas especialidades no momento.\n`;
        profileText += `Por favor, tente novamente mais tarde.`;
      }
    } else {
      profileText += `\n━━━━━━━━━━━━━━━━━\n`;
      profileText += `\n💡 *Como cliente, você pode:*\n`;
      profileText += `• Solicitar serviços de profissionais\n`;
      profileText += `• Acompanhar seus pedidos\n`;
      profileText += `• Avaliar profissionais\n\n`;
      profileText += `Digite *${ClientMenuOption.SOLICITAR_SERVICO}* para solicitar um serviço!`;
    }
    
    profileText += `\n\n━━━━━━━━━━━━━━━━━\n`;
    profileText += `Digite *${MenuOption.MENU}* ou *menu* para voltar ao menu principal.`;
    
    await this.sendMessage(`${phoneNumber}@c.us`, profileText);
  }

  private async sendWelcomeMessage(phoneNumber: string): Promise<void> {
    const welcomeText = 
      '👋 Olá! Bem-vindo ao Marido de Aluguel!\n\n' +
      'Sou seu assistente virtual e vou te ajudar.\n\n' +
      'Para começar, me diga:\n' +
      `${UserRegistrationOption.CLIENTE}️⃣ - Quero me cadastrar como CLIENTE\n` +
      `${UserRegistrationOption.PROFISSIONAL}️⃣ - Quero me cadastrar como PROFISSIONAL\n\n` +
      'Digite o número da opção desejada.';

    await this.sendMessage(`${phoneNumber}@c.us`, welcomeText);
  }

  private async sendWelcomeBackMessage(phoneNumber: string, userName: string): Promise<void> {
    const welcomeBackText = 
      `👋 Olá novamente, ${userName}!\n\n` +
      'É bom te ver por aqui! 😊\n\n' +
      'Como posso te ajudar hoje?\n\n' +
      `Digite *${MenuOption.MENU}* ou *menu* para ver as opções disponíveis.`;

    await this.sendMessage(`${phoneNumber}@c.us`, welcomeBackText);
  }

  private async sendHelpMessage(phoneNumber: string): Promise<void> {
    const user = await this.usersService.findByPhone(phoneNumber);
    
    let helpText = '📋 *MENU PRINCIPAL*\n\n';
    
    if (user) {
      this.logger.debug(`User ${user.getName()} type: ${user.getUserType()} (UserType.PROFESSIONAL = ${UserType.PROFESSIONAL}, UserType.CLIENT = ${UserType.CLIENT})`);
      
      helpText += `Olá, ${user.getName()}! 👋\n\n`;
      helpText += 'Escolha uma opção:\n\n';
      
      if (user.getUserType() === UserType.PROFESSIONAL) {
        helpText += 
          `${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES}️⃣ - Cadastrar/Editar Especialidades\n` +
          `${ProfessionalMenuOption.VER_SOLICITACOES}️⃣ - Ver Solicitações de Serviço\n` +
          `${ProfessionalMenuOption.VER_PERFIL}️⃣ - Ver Meu Perfil\n` +
          `${ProfessionalMenuOption.MENU}️⃣ - Ver este menu novamente\n`;
      } else {
        helpText += 
          `${ClientMenuOption.SOLICITAR_SERVICO}️⃣ - Solicitar Serviço\n` +
          `${ClientMenuOption.MEUS_PEDIDOS}️⃣ - Meus Pedidos\n` +
          `${ClientMenuOption.VER_PERFIL}️⃣ - Ver Meu Perfil\n` +
          `${ClientMenuOption.MENU}️⃣ - Ver este menu novamente\n`;
      }
    } else {
      helpText += 
        'Bem-vindo! 🎉\n\n' +
        'Escolha uma opção:\n\n' +
        `${UnregisteredMenuOption.FAZER_CADASTRO}️⃣ - Fazer Cadastro\n` +
        `${UnregisteredMenuOption.MENU}️⃣ - Ver este menu novamente\n`;
    }
    
    helpText += '\n💡 Digite apenas o número da opção desejada.';

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