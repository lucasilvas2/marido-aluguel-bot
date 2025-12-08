import { Injectable, Logger } from '@nestjs/common';
import { IConversationFlowHandler } from './interfaces/conversation-flow-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { ServiceRequestFlowDataDTO } from '../../dtos/service-request-flow-data.dto';
import { ServiceRequestRegistrationMessageFormatter } from '../formatters/service-request-registration-message.formatter';
import { SpecialtiesAppServiceInterface } from 'src/application/specialties/interfaces/specialties.app.service.interface';
import { ServiceRequestAppServiceInterface } from 'src/application/service-request/interfaces/service-request.app.service.interfaces';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { EventEmitterService } from 'src/application/events/event-emitter.service';
import { AvailableSpecialtyDTO } from '../../dtos/available-specialty.dto';
import { MenuOption } from '../enums/menu-option.enum';
import { ServiceRequestStatus } from 'src/domain/service-requests/enums/service-request-status.enum';
import { ServiceRequestCreatedEvent } from 'src/application/events/events/service-request/service-request-created.event';

/**
 * Handler para o fluxo completo de solicitação de serviço
 * Gerencia coleta de especialidade e descrição do problema
 */
@Injectable()
export class ServiceRequestRegistrationFlowHandler implements IConversationFlowHandler {
  private readonly logger = new Logger(ServiceRequestRegistrationFlowHandler.name);

  constructor(
    private readonly formatter: ServiceRequestRegistrationMessageFormatter,
    private readonly specialtiesService: SpecialtiesAppServiceInterface,
    private readonly serviceRequestService: ServiceRequestAppServiceInterface,
    private readonly usersService: UsersServiceInterface,
    private readonly whatsappService: WhatsappWebService,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  getHandlerName(): string {
    return 'ServiceRequestRegistrationFlowHandler';
  }

  getHandledStates(): string[] {
    return [
      'waiting_service_specialty_selection',
      'waiting_service_description',
      'waiting_service_confirmation',
    ];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    if (!state || !user) return false;
    return this.getHandledStates().includes(state.state);
  }

  async validateInput(
    input: string,
    currentState: ConversationStateDTO,
  ): Promise<{ isValid: boolean; errorMessage?: string }> {
    const { state, data } = currentState;
    const flowData = data as ServiceRequestFlowDataDTO;

    // Validação de seleção de especialidade
    if (state === 'waiting_service_specialty_selection') {
      const specialtyNumber = parseInt(input.trim());
      
      if (isNaN(specialtyNumber) || specialtyNumber < 1) {
        return {
          isValid: false,
          errorMessage: '❌ Por favor, digite um número válido da especialidade.',
        };
      }

      // Verificar se a especialidade existe
      const specialties = await this.specialtiesService.all();
      if (specialtyNumber > specialties.length) {
        return {
          isValid: false,
          errorMessage: `❌ Especialidade não encontrada. Por favor, escolha um número entre 1 e ${specialties.length}.`,
        };
      }
    }

    // Validação de descrição
    if (state === 'waiting_service_description') {
      const description = input.trim();
      
      if (description.length < 10) {
        return {
          isValid: false,
          errorMessage: '❌ A descrição deve ter no mínimo 10 caracteres. Por favor, descreva seu problema com mais detalhes.',
        };
      }

      if (description.length > 500) {
        return {
          isValid: false,
          errorMessage: '❌ A descrição é muito longa (máximo 500 caracteres). Por favor, seja mais conciso.',
        };
      }
    }

    // Validação de confirmação
    if (state === 'waiting_service_confirmation') {
      const normalizedInput = input.trim();
      
      if (normalizedInput !== '1' && normalizedInput !== MenuOption.MENU) {
        return {
          isValid: false,
          errorMessage: `❌ Opção inválida. Digite *1* para confirmar ou *${MenuOption.MENU}* para cancelar.`,
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
      case 'waiting_service_specialty_selection':
        return await this.handleSpecialtySelection(message, data as ServiceRequestFlowDataDTO);

      case 'waiting_service_description':
        return await this.handleServiceDescription(message, data as ServiceRequestFlowDataDTO);

      case 'waiting_service_confirmation':
        return await this.handleServiceConfirmation(message, data as ServiceRequestFlowDataDTO);

      default:
        return null;
    }
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    if (!state || !user) return null;

    this.logger.log(`Processing service request step: ${state.state} for ${message.phoneNumber}`);

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

  /**
   * Processa a seleção de especialidade
   */
  private async handleSpecialtySelection(
    message: ConversationMessageDTO,
    data: ServiceRequestFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const specialtyNumber = parseInt(message.body.trim());
    const specialties = await this.specialtiesService.all();
    const selectedSpecialty = specialties[specialtyNumber - 1];

    const confirmationMessage = this.formatter.formatSpecialtySelectionConfirmation(
      selectedSpecialty.getName(),
    );
    
    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      confirmationMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'waiting_service_description',
      data: {
        ...data,
        specialtyId: selectedSpecialty.getId(),
        specialtyName: selectedSpecialty.getName(),
      },
    };
  }

  /**
   * Processa a descrição do serviço
   */
  private async handleServiceDescription(
    message: ConversationMessageDTO,
    data: ServiceRequestFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const description = message.body.trim();

    const summaryMessage = this.formatter.formatServiceRequestSummary(
      data.specialtyName!,
      description,
    );

    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      summaryMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'waiting_service_confirmation',
      data: {
        ...data,
        description,
      },
    };
  }

  /**
   * Processa a confirmação final e cria a solicitação
   */
  private async handleServiceConfirmation(
    message: ConversationMessageDTO,
    data: ServiceRequestFlowDataDTO,
  ): Promise<ConversationStateDTO | null> {
    const input = message.body.trim();

    // Se usuário cancelar
    if (input === MenuOption.MENU) {
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Solicitação de serviço cancelada. Digite *0* para voltar ao menu.',
      );
      return null; // Retorna ao menu
    }

    // Confirmar e criar solicitação
    try {
      // Buscar o usuário pelo telefone para pegar o ID
      const userId = await this.getUserIdByPhone(message.phoneNumber);

      // Criar a solicitação de serviço com status PENDING
      const serviceRequest = await this.serviceRequestService.create(
        userId,
        null, // professionalId é null inicialmente
        data.specialtyId!,
        ServiceRequestStatus.PENDING,
        data.description!,
      );

      this.logger.log(
        `Service request created successfully: ID ${serviceRequest.getId()} for user ${userId}, specialty ${data.specialtyId}`
      );

      // Emitir evento de serviço solicitado (para notificar profissionais)
      const event = new ServiceRequestCreatedEvent(
        userId,
        message.phoneNumber,
        serviceRequest.getId(),
        data.specialtyId!,
        data.specialtyName!,
        data.description!,
        ServiceRequestStatus.PENDING,
      );

      await this.eventEmitter.emit(event);

      this.logger.log(`Event emitted: service-request.created for request ${serviceRequest.getId()}`);

      const confirmationMessage = this.formatter.formatServiceRequestConfirmation();
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        confirmationMessage,
      );

      // Finalizar fluxo
      return null;
    } catch (error) {
      this.logger.error(`Error creating service request: ${error.message}`, error.stack);
      
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Ocorreu um erro ao registrar sua solicitação. Por favor, tente novamente mais tarde.',
      );

      return null;
    }
  }

  /**
   * Busca o ID do usuário pelo telefone
   */
  private async getUserIdByPhone(phoneNumber: string): Promise<number> {
    const user = await this.usersService.findByPhone(phoneNumber);
    
    if (!user) {
      throw new Error(`User not found for phone number: ${phoneNumber}`);
    }
    
    return user.getId();
  }

  /**
   * Inicia o fluxo de solicitação de serviço
   * Chamado externamente quando usuário escolhe "Solicitar Serviço" no menu
   */
  async startServiceRequestFlow(
    phoneNumber: string,
    userName: string,
  ): Promise<ConversationStateDTO> {
    const specialties = await this.specialtiesService.all();
    
    const availableSpecialties: AvailableSpecialtyDTO[] = specialties.map((s) => ({
      id: s.getId(),
      name: s.getName(),
      description: s.getDescription(),
    }));

    const startMessage = this.formatter.formatServiceRequestRegistrationStart(
      userName,
      availableSpecialties,
    );

    await this.whatsappService.sendMessage(`${phoneNumber}@c.us`, startMessage);

    return {
      userId: phoneNumber,
      state: 'waiting_service_specialty_selection',
      data: {},
    };
  }
}
