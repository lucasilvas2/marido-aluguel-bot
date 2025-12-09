import { Injectable, Logger } from '@nestjs/common';
import { IConversationFlowHandler } from './interfaces/conversation-flow-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { ProfessionalServiceRequestFormatter, AvailableServiceRequestDTO } from '../formatters/professional-service-request.formatter';
import { ServiceRequestAppServiceInterface } from 'src/application/service-request/interfaces/service-request.app.service.interfaces';
import { ServiceRequestProposalAppServiceInterface } from 'src/application/service-request/interfaces/service-request-proposal.app.service.interface';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { EventEmitterService } from 'src/application/events/event-emitter.service';
import { ServiceRequestProposalCreatedEvent } from 'src/application/events/events/service-request/service-request-proposal-created.event';
import { ServiceRequestStatus } from 'src/domain/service-requests/enums/service-request-status.enum';
import { MenuOption } from '../enums/menu-option.enum';

/**
 * DTO para dados do fluxo
 */
interface ViewAvailableRequestsFlowDataDTO {
  requests?: AvailableServiceRequestDTO[];
  selectedRequestId?: number;
  awaitingProposeConfirmation?: boolean;
}

/**
 * Handler para fluxo de visualização e aceitação de solicitações disponíveis
 */
@Injectable()
export class AvailableServiceRequestsFlowHandler implements IConversationFlowHandler {
  private readonly logger = new Logger(AvailableServiceRequestsFlowHandler.name);

  constructor(
    private readonly formatter: ProfessionalServiceRequestFormatter,
    private readonly serviceRequestService: ServiceRequestAppServiceInterface,
    private readonly proposalService: ServiceRequestProposalAppServiceInterface,
    private readonly usersService: UsersServiceInterface,
    private readonly whatsappService: WhatsappWebService,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  getHandlerName(): string {
    return 'AvailableServiceRequestsFlowHandler';
  }

  getHandledStates(): string[] {
    return ['viewing_available_requests'];
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
    const { data } = currentState;
    const flowData = data as ViewAvailableRequestsFlowDataDTO;

    // Se está aguardando confirmação
    if (flowData.awaitingProposeConfirmation) {
      const normalized = input.toLowerCase().trim();
      if (normalized !== 'confirmar' && normalized !== MenuOption.MENU && normalized !== '0') {
        return {
          isValid: false,
          errorMessage: `❌ Opção inválida. Digite *confirmar* para enviar proposta ou *${MenuOption.MENU}* para voltar.`,
        };
      }
      return { isValid: true };
    }

    // Validação de seleção de número
    const requestNumber = parseInt(input.trim());
    if (!isNaN(requestNumber)) {
      if (requestNumber < 1 || requestNumber > (flowData.requests?.length || 0)) {
        return {
          isValid: false,
          errorMessage: `❌ Número inválido. Escolha entre 1 e ${flowData.requests?.length || 0}.`,
        };
      }
    }

    // Validação de comando aceitar
    if (input.toLowerCase().startsWith('aceitar')) {
      const parts = input.split(' ');
      if (parts.length < 2) {
        return {
          isValid: false,
          errorMessage: '❌ Use o formato: *aceitar [número]*\nExemplo: aceitar 1',
        };
      }

      const requestNumber = parseInt(parts[1]);
      if (isNaN(requestNumber)) {
        return {
          isValid: false,
          errorMessage: '❌ Número da solicitação inválido. Use: *aceitar [número]*',
        };
      }

      // Validar se o número está no range
      if (requestNumber < 1 || requestNumber > (flowData.requests?.length || 0)) {
        return {
          isValid: false,
          errorMessage: `❌ Número inválido. Escolha entre 1 e ${flowData.requests?.length || 0}.`,
        };
      }
    }

    return { isValid: true };
  }

  async processStep(
    message: ConversationMessageDTO,
    state: ConversationStateDTO,
  ): Promise<ConversationStateDTO | null> {
    const { data } = state;
    const flowData = data as ViewAvailableRequestsFlowDataDTO;
    const input = message.body.trim();

    // Se está confirmando proposta
    if (flowData.awaitingProposeConfirmation && input.toLowerCase() === 'confirmar') {
      return await this.handleProposeConfirmation(message, flowData);
    }

    // Se é comando de proposta explícito
    if (input.toLowerCase().startsWith('aceitar')) {
      return await this.handleProposeRequest(message, flowData);
    }

    // Se é seleção de número
    const requestNumber = parseInt(input);
    if (!isNaN(requestNumber) && requestNumber >= 1) {
      // Se já tem uma solicitação selecionada e o usuário digita o mesmo número,
      // interpretar como proposta implícita
      if (flowData.selectedRequestId) {
        const selectedIndex = flowData.requests?.findIndex(r => r.id === flowData.selectedRequestId);
        if (selectedIndex !== undefined && selectedIndex !== -1 && (selectedIndex + 1) === requestNumber) {
          // Usuário digitou o mesmo número da solicitação já selecionada
          // Processar como proposta
          return await this.handleProposeRequest(message, flowData);
        }
      }
      
      // Caso contrário, exibir detalhes
      return await this.handleRequestSelection(message, flowData, requestNumber);
    }

    // Mensagem não reconhecida
    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      `❌ Comando não reconhecido.\n\nDigite o número da solicitação para ver detalhes.\nDigite *aceitar [número]* para aceitar.\nDigite *${MenuOption.MENU}* para voltar ao menu.`,
    );

    return state;
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    if (!state || !user) return null;

    this.logger.log(`Processing available requests view step for ${message.phoneNumber}`);

    // Valida input
    const validation = await this.validateInput(message.body, state);
    if (!validation.isValid) {
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        validation.errorMessage!,
      );
      return state;
    }

    // Processa passo
    return await this.processStep(message, state);
  }

  /**
   * Exibe detalhes de uma solicitação selecionada
   */
  private async handleRequestSelection(
    message: ConversationMessageDTO,
    flowData: ViewAvailableRequestsFlowDataDTO,
    requestNumber: number,
  ): Promise<ConversationStateDTO> {
    const selectedRequest = flowData.requests![requestNumber - 1];

    const detailsMessage = this.formatter.formatAvailableServiceRequestDetails(
      selectedRequest,
      requestNumber, // Passa a posição na lista
    );
    
    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      detailsMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'viewing_available_requests',
      data: {
        ...flowData,
        selectedRequestId: selectedRequest.id,
      },
    };
  }

  /**
   * Inicia processo de criação de proposta
   */
  private async handleProposeRequest(
    message: ConversationMessageDTO,
    flowData: ViewAvailableRequestsFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const input = message.body.trim();
    let requestNumber: number;

    // Se o comando começa com "aceitar", extrair o número
    if (input.toLowerCase().startsWith('aceitar')) {
      const parts = input.split(' ');
      requestNumber = parseInt(parts[1]);
    } else {
      // Se é apenas o número, usar diretamente
      requestNumber = parseInt(input);
    }

    const request = flowData.requests?.[requestNumber - 1];

    if (!request) {
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        this.formatter.formatRequestNotAvailable(),
      );
      return {
        userId: message.phoneNumber,
        state: 'viewing_available_requests',
        data: flowData,
      };
    }

    const confirmationMessage = this.formatter.formatProposeConfirmation(
      request.id,
      request.clientName,
      request.specialtyName,
    );

    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      confirmationMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'viewing_available_requests',
      data: {
        ...flowData,
        selectedRequestId: request.id,
        awaitingProposeConfirmation: true,
      },
    };
  }

  /**
   * Confirma e cria proposta
   */
  private async handleProposeConfirmation(
    message: ConversationMessageDTO,
    flowData: ViewAvailableRequestsFlowDataDTO,
  ): Promise<ConversationStateDTO | null> {
    try {
      const requestId = flowData.selectedRequestId!;
      
      // Buscar a solicitação completa
      const serviceRequest = await this.serviceRequestService.findById(requestId);

      if (!serviceRequest || serviceRequest.getStatus() !== ServiceRequestStatus.PENDING) {
        const errorMessage = this.formatter.formatRequestNotAvailable();
        await this.whatsappService.sendMessage(
          `${message.phoneNumber}@c.us`,
          errorMessage,
        );
        return null;
      }

      // Buscar usuário profissional
      const professional = await this.usersService.findByPhone(message.phoneNumber);
      if (!professional) {
        return null;
      }

      // Buscar cliente
      const client = await this.usersService.findById(serviceRequest.getClientId());

      // Criar proposta
      const proposal = await this.proposalService.create(
        requestId,
        professional.getId(),
      );

      // Emitir evento de proposta criada
      const event = new ServiceRequestProposalCreatedEvent(
        professional.getId(),
        message.phoneNumber,
        requestId,
        proposal.getId(),
        professional.getId(),
        professional.getName(),
        serviceRequest.getClientId(),
        client?.getWhatsappNumber() || '',
      );

      await this.eventEmitter.emit(event);

      this.logger.log(`Proposal ${proposal.getId()} created for service request ${requestId} by professional ${professional.getId()}`);

      // Enviar confirmação
      const successMessage = this.formatter.formatProposeSuccess();
      
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        successMessage,
      );

      // Finalizar fluxo
      return null;
    } catch (error) {
      this.logger.error(`Error creating proposal: ${error.message}`, error.stack);

      let errorMessage = '❌ Ocorreu um erro ao enviar sua proposta. Por favor, tente novamente mais tarde.';
      
      // Tratar erros específicos
      if (error.message.includes('já enviou uma proposta')) {
        errorMessage = '❌ Você já enviou uma proposta para este serviço.';
      } else if (error.message.includes('Limite de propostas atingido')) {
        errorMessage = '❌ Este serviço já atingiu o limite de propostas.';
      }

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        errorMessage,
      );

      return null;
    }
  }
}
