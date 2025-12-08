import { Injectable, Inject, Logger } from '@nestjs/common';
import { IConversationFlowHandler } from './interfaces/conversation-flow-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { UserRegistrationDTO } from '../../dtos/user-registration.dto';
import { AddressDataDTO } from '../../dtos/address-data.dto';
import { UserRegistrationFlowDataDTO } from '../../dtos/user-registration-flow-data.dto';
import { RegistrationMessageFormatter } from '../formatters/registration-message.formatter';
import { EmailValidator } from '../validators/email.validator';
import { PostalCodeValidator } from '../validators/postal-code.validator';
import { StateValidator } from '../validators/state.validator';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UserRegistrationService } from 'src/application/users/services/user-registration.service';
import { EventEmitterService } from 'src/application/events/event-emitter.service';
import { UserRegisteredEvent } from 'src/application/events/events/user/user-registered.event';
import { ConversationCompletedEvent } from 'src/application/events/events/conversation/conversation-completed.event';
import { UserRegistrationOption } from '../enums/menu-option.enum';
import { UserTypeString, UserType, UserTypeLabel } from 'src/domain/users/entities/enums/user-type.enum';

/**
 * Handler para o fluxo completo de cadastro de usuário
 * Gerencia coleta de dados pessoais e endereço
 */
@Injectable()
export class UserRegistrationFlowHandler implements IConversationFlowHandler {
  private readonly logger = new Logger(UserRegistrationFlowHandler.name);

  constructor(
    private readonly regFormatter: RegistrationMessageFormatter,
    private readonly emailValidator: EmailValidator,
    private readonly postalCodeValidator: PostalCodeValidator,
    private readonly stateValidator: StateValidator,
    private readonly whatsappService: WhatsappWebService,
    private readonly userRegistrationService: UserRegistrationService,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  getHandlerName(): string {
    return 'UserRegistrationFlowHandler';
  }

  getHandledStates(): string[] {
    return ['waiting_service_type', 'waiting_user_info', 'waiting_address'];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    if (!state) return false;
    return this.getHandledStates().includes(state.state);
  }

  async validateInput(
    input: string,
    currentState: ConversationStateDTO,
  ): Promise<{ isValid: boolean; errorMessage?: string }> {
    const { state, data } = currentState;
    const flowData = data as UserRegistrationFlowDataDTO;

    // Validação de tipo de usuário
    if (state === 'waiting_service_type') {
      const lowerInput = input.toLowerCase().trim();
      const isValid =
        lowerInput.includes(UserRegistrationOption.CLIENTE) ||
        lowerInput.includes('cliente') ||
        lowerInput.includes(UserRegistrationOption.PROFISSIONAL) ||
        lowerInput.includes('profissional');

      if (!isValid) {
        return {
          isValid: false,
          errorMessage: `❌ Opção inválida. Por favor, escolha:\n${UserRegistrationOption.CLIENTE} - Cliente\n${UserRegistrationOption.PROFISSIONAL} - Profissional`,
        };
      }
    }

    // Validação de email
    if (state === 'waiting_user_info' && flowData?.name) {
      if (!this.emailValidator.isValid(input)) {
        return {
          isValid: false,
          errorMessage: this.emailValidator.getErrorMessage(),
        };
      }
    }

    // Validação de CEP
    if (state === 'waiting_address' && !flowData?.address?.postalCode) {
      if (!this.postalCodeValidator.isValid(input)) {
        return {
          isValid: false,
          errorMessage: this.postalCodeValidator.getErrorMessage(),
        };
      }
    }

    // Validação de estado (UF)
    if (
      state === 'waiting_address' &&
      flowData?.address?.postalCode &&
      flowData?.address?.street &&
      flowData?.address?.number &&
      flowData?.address?.neighborhood &&
      flowData?.address?.city &&
      !flowData?.address?.state
    ) {
      if (!this.stateValidator.isValid(input)) {
        return {
          isValid: false,
          errorMessage: this.stateValidator.getErrorMessage(),
        };
      }
    }

    return { isValid: true };
  }

  async processStep(
    message: ConversationMessageDTO,
    state: ConversationStateDTO,
  ): Promise<ConversationStateDTO | null> {
    const { state: currentState, data } = state;

    switch (currentState) {
      case 'waiting_service_type':
        return await this.handleServiceTypeSelection(message, data as UserRegistrationFlowDataDTO);

      case 'waiting_user_info':
        return await this.handleUserInfo(message, data as UserRegistrationFlowDataDTO);

      case 'waiting_address':
        return await this.handleAddress(message, data as UserRegistrationFlowDataDTO);

      default:
        return null;
    }
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    if (!state) return null;

    this.logger.log(`Processing registration step: ${state.state} for ${message.phoneNumber}`);

    // Valida input
    const validation = await this.validateInput(message.body, state);
    if (!validation.isValid) {
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        validation.errorMessage!,
      );
      return state; // Mantém estado atual
    }

    // Processa passo
    return await this.processStep(message, state);
  }

  private async handleServiceTypeSelection(
    message: ConversationMessageDTO,
    data: UserRegistrationFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const lowerBody = message.body.toLowerCase().trim();
    const isClient =
      lowerBody.includes(UserRegistrationOption.CLIENTE) || lowerBody.includes('cliente');

    const userType = isClient ? UserTypeString.CLIENT : UserTypeString.PROFESSIONAL;

    const prompt = this.regFormatter.formatNamePrompt(isClient);
    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, prompt);

    return {
      userId: message.phoneNumber,
      state: 'waiting_user_info',
      data: { ...data, userType },
    };
  }

  private async handleUserInfo(
    message: ConversationMessageDTO,
    data: UserRegistrationFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    // Coletando nome
    if (!data.name) {
      const name = message.body.trim();
      const prompt = this.regFormatter.formatEmailPrompt(name);
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, prompt);

      return {
        userId: message.phoneNumber,
        state: 'waiting_user_info',
        data: { ...data, name },
      };
    }

    // Coletando email
    if (!data.email) {
      const email = this.emailValidator.sanitize(message.body);
      const prompt = this.regFormatter.formatPostalCodePrompt();
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, prompt);

      return {
        userId: message.phoneNumber,
        state: 'waiting_address',
        data: { ...data, email },
      };
    }

    return {
      userId: message.phoneNumber,
      state: 'waiting_user_info',
      data,
    };
  }

  private async handleAddress(
    message: ConversationMessageDTO,
    data: UserRegistrationFlowDataDTO,
  ): Promise<ConversationStateDTO | null> {
    const addressData = data.address || {};

    // CEP
    if (!addressData.postalCode) {
      const postalCode = this.postalCodeValidator.sanitize(message.body);
      const prompt = this.regFormatter.formatStreetPrompt();
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, prompt);

      return {
        userId: message.phoneNumber,
        state: 'waiting_address',
        data: { ...data, address: { ...addressData, postalCode } },
      };
    }

    // Rua
    if (!addressData.street) {
      const prompt = this.regFormatter.formatNumberPrompt();
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, prompt);

      return {
        userId: message.phoneNumber,
        state: 'waiting_address',
        data: { ...data, address: { ...addressData, street: message.body.trim() } },
      };
    }

    // Número
    if (!addressData.number) {
      const prompt = this.regFormatter.formatNeighborhoodPrompt();
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, prompt);

      return {
        userId: message.phoneNumber,
        state: 'waiting_address',
        data: { ...data, address: { ...addressData, number: message.body.trim() } },
      };
    }

    // Bairro
    if (!addressData.neighborhood) {
      const prompt = this.regFormatter.formatCityPrompt();
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, prompt);

      return {
        userId: message.phoneNumber,
        state: 'waiting_address',
        data: { ...data, address: { ...addressData, neighborhood: message.body.trim() } },
      };
    }

    // Cidade
    if (!addressData.city) {
      const prompt = this.regFormatter.formatStatePrompt();
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, prompt);

      return {
        userId: message.phoneNumber,
        state: 'waiting_address',
        data: { ...data, address: { ...addressData, city: message.body.trim() } },
      };
    }

    // Estado (final)
    if (!addressData.state) {
      const state = this.stateValidator.sanitize(message.body);

      const finalData: UserRegistrationFlowDataDTO = {
        ...data,
        address: { ...addressData, state },
      };

      // Registra usuário
      await this.registerUser(message.phoneNumber, finalData);

      // Retorna null para limpar estado
      return null;
    }

    return {
      userId: message.phoneNumber,
      state: 'waiting_address',
      data,
    };
  }

  private async registerUser(
    phoneNumber: string,
    data: UserRegistrationFlowDataDTO,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const userData: UserRegistrationDTO = {
        name: data.name!,
        email: data.email!,
        phone: phoneNumber,
        userType: data.userType!,
      };

      const addressData: AddressDataDTO = {
        street: data.address!.street!,
        number: data.address!.number!,
        neighborhood: data.address!.neighborhood!,
        city: data.address!.city!,
        state: data.address!.state!,
        postalCode: data.address!.postalCode!,
        complement: data.address!.complement || null,
      };

      const result = await this.userRegistrationService.registerUser(userData, addressData);

      this.logger.log(`User ${phoneNumber} registered successfully`);

      // Emite evento de usuário registrado
      const userType = userData.userType === UserTypeString.CLIENT ? UserType.CLIENT : UserType.PROFESSIONAL;
      const registeredEvent = new UserRegisteredEvent(
        result.user.id,
        phoneNumber,
        userData.name,
        userData.email,
        userType,
      );
      await this.eventEmitter.emit(registeredEvent);

      // Emite evento de conversa completada
      const duration = Date.now() - startTime;
      const completedEvent = new ConversationCompletedEvent(
        phoneNumber,
        'registration',
        'success',
        duration,
        8, // 8 passos: tipo, nome, email, cep, rua, número, bairro, cidade, estado
      );
      await this.eventEmitter.emit(completedEvent);

      // Envia mensagem de sucesso
      const successMessage = this.regFormatter.formatRegistrationSuccessMessage(userData);
      await this.whatsappService.sendMessage(`${phoneNumber}@c.us`, successMessage);
    } catch (error) {
      this.logger.error(`Error registering user ${phoneNumber}:`, error);

      // Emite evento de conversa completada com erro
      const duration = Date.now() - startTime;
      const completedEvent = new ConversationCompletedEvent(
        phoneNumber,
        'registration',
        'error',
        duration,
        8,
      );
      await this.eventEmitter.emit(completedEvent);

      // Verifica se é erro de duplicação
      if (error && (error.code === 'P2002' || (error.meta && error.meta.target && error.meta.target.includes('User_phone_key')))) {
        const errorMessage = this.regFormatter.formatDuplicateUserMessage();
        await this.whatsappService.sendMessage(`${phoneNumber}@c.us`, errorMessage);
      } else {
        const errorMessage = this.regFormatter.formatRegistrationErrorMessage();
        await this.whatsappService.sendMessage(`${phoneNumber}@c.us`, errorMessage);
      }

      throw error;
    }
  }
}
