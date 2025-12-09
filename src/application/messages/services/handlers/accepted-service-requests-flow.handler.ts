import { Injectable, Logger } from '@nestjs/common';
import { IConversationFlowHandler } from './interfaces/conversation-flow-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { ProfessionalServiceRequestFormatter, AcceptedServiceRequestDTO } from '../formatters/professional-service-request.formatter';
import { ServiceRequestAppServiceInterface } from 'src/application/service-request/interfaces/service-request.app.service.interfaces';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { EventEmitterService } from 'src/application/events/event-emitter.service';
import { ServiceRequestCompletedEvent } from 'src/application/events/events/service-request/service-request-completed.event';
import { ServiceRequestCancelledEvent } from 'src/application/events/events/service-request/service-request-cancelled.event';
import { ServiceRequestStatus } from 'src/domain/service-requests/enums/service-request-status.enum';
import { MenuOption } from '../enums/menu-option.enum';

/**
 * DTO para dados do fluxo
 */
interface ManageAcceptedRequestsFlowDataDTO {
  requests?: AcceptedServiceRequestDTO[];
  selectedRequestId?: number;
  awaitingConfirmation?: {
    action: 'iniciar' | 'concluir' | 'cancelar';
    newStatus: string;
  };
}

/**
 * Handler para fluxo de gerenciamento de serviços aceitos
 */
@Injectable()
export class AcceptedServiceRequestsFlowHandler implements IConversationFlowHandler {
  private readonly logger = new Logger(AcceptedServiceRequestsFlowHandler.name);

  constructor(
    private readonly formatter: ProfessionalServiceRequestFormatter,
    private readonly serviceRequestService: ServiceRequestAppServiceInterface,
    private readonly whatsappService: WhatsappWebService,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  getHandlerName(): string {
    return 'AcceptedServiceRequestsFlowHandler';
  }

  getHandledStates(): string[] {
    return ['managing_accepted_requests'];
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
    const flowData = data as ManageAcceptedRequestsFlowDataDTO;

    // Se está aguardando confirmação
    if (flowData.awaitingConfirmation) {
      const normalized = input.toLowerCase().trim();
      if (normalized !== 'confirmar' && normalized !== MenuOption.MENU && normalized !== '0') {
        return {
          isValid: false,
          errorMessage: `❌ Opção inválida. Digite *confirmar* ou *${MenuOption.MENU}* para voltar.`,
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

    return { isValid: true };
  }

  async processStep(
    message: ConversationMessageDTO,
    state: ConversationStateDTO,
  ): Promise<ConversationStateDTO | null> {
    const { data } = state;
    const flowData = data as ManageAcceptedRequestsFlowDataDTO;
    const input = message.body.toLowerCase().trim();

    // Se está confirmando ação
    if (flowData.awaitingConfirmation && input === 'confirmar') {
      return await this.handleStatusChangeConfirmation(message, flowData);
    }

    // Se é comando de mudança de status explícito
    if (input.startsWith('iniciar') || input.startsWith('concluir') || input.startsWith('cancelar')) {
      return await this.handleStatusChangeRequest(message, flowData, input);
    }

    // Se é seleção de número
    const requestNumber = parseInt(message.body.trim());
    if (!isNaN(requestNumber) && requestNumber >= 1) {
      // Se já tem uma solicitação selecionada, exibir apenas os detalhes
      // (não inferir ação implícita neste fluxo, pois as ações são críticas)
      return await this.handleRequestSelection(message, flowData, requestNumber);
    }

    // Mensagem não reconhecida
    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      `❌ Comando não reconhecido.\n\nDigite o número do serviço para ver detalhes.\nDigite *iniciar [número]*, *concluir [número]* ou *cancelar [número]*.\nDigite *${MenuOption.MENU}* para voltar ao menu.`,
    );

    return state;
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    if (!state || !user) return null;

    this.logger.log(`Processing accepted requests management step for ${message.phoneNumber}`);

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
   * Exibe detalhes de um serviço selecionado
   */
  private async handleRequestSelection(
    message: ConversationMessageDTO,
    flowData: ManageAcceptedRequestsFlowDataDTO,
    requestNumber: number,
  ): Promise<ConversationStateDTO> {
    const selectedRequest = flowData.requests![requestNumber - 1];

    const detailsMessage = this.formatter.formatAcceptedServiceRequestDetails(
      selectedRequest,
      requestNumber, // Passa a posição na lista
    );
    
    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      detailsMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'managing_accepted_requests',
      data: {
        ...flowData,
        selectedRequestId: selectedRequest.id,
      },
    };
  }

  /**
   * Inicia processo de mudança de status
   */
  private async handleStatusChangeRequest(
    message: ConversationMessageDTO,
    flowData: ManageAcceptedRequestsFlowDataDTO,
    input: string,
  ): Promise<ConversationStateDTO> {
    const parts = input.split(' ');
    const action = parts[0] as 'iniciar' | 'concluir' | 'cancelar';
    const requestNumber = parseInt(parts[1]);

    if (isNaN(requestNumber)) {
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        `❌ Use o formato: *${action} [número]*\nExemplo: ${action} 1`,
      );
      return {
        userId: message.phoneNumber,
        state: 'managing_accepted_requests',
        data: flowData,
      };
    }

    const request = flowData.requests?.[requestNumber - 1];

    if (!request) {
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Serviço não encontrado.',
      );
      return {
        userId: message.phoneNumber,
        state: 'managing_accepted_requests',
        data: flowData,
      };
    }

    // Determinar novo status
    const statusMap = {
      iniciar: ServiceRequestStatus.IN_PROGRESS,
      concluir: ServiceRequestStatus.COMPLETED,
      cancelar: ServiceRequestStatus.CANCELLED,
    };

    const newStatus = statusMap[action];

    const confirmationMessage = this.formatter.formatStatusChangeConfirmation(
      request.id,
      action,
      newStatus,
    );

    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      confirmationMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'managing_accepted_requests',
      data: {
        ...flowData,
        selectedRequestId: request.id,
        awaitingConfirmation: { action, newStatus },
      },
    };
  }

  /**
   * Confirma e executa mudança de status
   */
  private async handleStatusChangeConfirmation(
    message: ConversationMessageDTO,
    flowData: ManageAcceptedRequestsFlowDataDTO,
  ): Promise<ConversationStateDTO | null> {
    try {
      const requestId = flowData.selectedRequestId!;
      const { action, newStatus } = flowData.awaitingConfirmation!;
      
      // Buscar a solicitação completa
      const serviceRequest = await this.serviceRequestService.findById(requestId);

      if (!serviceRequest) {
        await this.whatsappService.sendMessage(
          `${message.phoneNumber}@c.us`,
          '❌ Serviço não encontrado.',
        );
        return null;
      }

      // Atualizar status
      await this.serviceRequestService.update(
        requestId,
        serviceRequest.getClientId(),
        serviceRequest.getProfessionalId() || null,
        serviceRequest.getSpecialtyId(),
        newStatus,
        serviceRequest.getDescription() || '',
      );

      // Emitir evento apropriado
      if (newStatus === ServiceRequestStatus.COMPLETED) {
        const event = new ServiceRequestCompletedEvent(
          serviceRequest.getProfessionalId()!,
          message.phoneNumber,
          requestId,
          serviceRequest.getProfessionalId()!,
          serviceRequest.getClientId(),
          new Date(),
        );
        await this.eventEmitter.emit(event);
      } else if (newStatus === ServiceRequestStatus.CANCELLED) {
        const event = new ServiceRequestCancelledEvent(
          serviceRequest.getProfessionalId()!,
          message.phoneNumber,
          requestId,
          'professional',
          'Cancelado pelo profissional',
        );
        await this.eventEmitter.emit(event);
      }

      this.logger.log(`Service request ${requestId} status changed to ${newStatus} by professional`);

      // Enviar confirmação
      const successMessage = this.formatter.formatStatusChangeSuccess(newStatus);
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        successMessage,
      );

      // Finalizar fluxo
      return null;
    } catch (error) {
      this.logger.error(`Error changing service request status: ${error.message}`, error.stack);

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Ocorreu um erro ao atualizar o status. Por favor, tente novamente mais tarde.',
      );

      return null;
    }
  }
}
