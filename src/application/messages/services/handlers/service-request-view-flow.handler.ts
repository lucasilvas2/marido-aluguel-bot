import { Injectable, Logger } from '@nestjs/common';
import { IConversationFlowHandler } from './interfaces/conversation-flow-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { ServiceRequestViewMessageFormatter, ServiceRequestDisplayDTO } from '../formatters/service-request-view-message.formatter';
import { ServiceRequestAppServiceInterface } from 'src/application/service-request/interfaces/service-request.app.service.interfaces';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { EventEmitterService } from 'src/application/events/event-emitter.service';
import { ServiceRequestCancelledEvent } from 'src/application/events/events/service-request/service-request-cancelled.event';
import { ServiceRequestStatus } from 'src/domain/service-requests/enums/service-request-status.enum';
import { MenuOption } from '../enums/menu-option.enum';

/**
 * DTO para dados do fluxo de visualização
 */
interface ViewServiceRequestFlowDataDTO {
  requests?: ServiceRequestDisplayDTO[];
  selectedRequestId?: number;
  awaitingCancelConfirmation?: boolean;
}

/**
 * Handler para fluxo de visualização e gerenciamento de solicitações
 * Gerencia seleção de detalhes e cancelamento
 */
@Injectable()
export class ServiceRequestViewFlowHandler implements IConversationFlowHandler {
  private readonly logger = new Logger(ServiceRequestViewFlowHandler.name);

  constructor(
    private readonly formatter: ServiceRequestViewMessageFormatter,
    private readonly serviceRequestService: ServiceRequestAppServiceInterface,
    private readonly whatsappService: WhatsappWebService,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  getHandlerName(): string {
    return 'ServiceRequestViewFlowHandler';
  }

  getHandledStates(): string[] {
    return ['viewing_service_requests'];
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
    const flowData = data as ViewServiceRequestFlowDataDTO;

    // Se está aguardando confirmação de cancelamento
    if (flowData.awaitingCancelConfirmation) {
      const normalized = input.toLowerCase().trim();
      if (normalized !== 'confirmar' && normalized !== MenuOption.MENU && normalized !== '0') {
        return {
          isValid: false,
          errorMessage: `❌ Opção inválida. Digite *confirmar* para cancelar ou *${MenuOption.MENU}* para voltar.`,
        };
      }
      return { isValid: true };
    }

    // Validação de seleção de número da solicitação
    const requestNumber = parseInt(input.trim());
    if (!isNaN(requestNumber)) {
      if (requestNumber < 1 || requestNumber > (flowData.requests?.length || 0)) {
        return {
          isValid: false,
          errorMessage: `❌ Número inválido. Escolha entre 1 e ${flowData.requests?.length || 0}.`,
        };
      }
    }

    // Validação de comando de cancelamento
    if (input.toLowerCase().startsWith('cancelar')) {
      const parts = input.split(' ');
      if (parts.length < 2) {
        return {
          isValid: false,
          errorMessage: '❌ Use o formato: *cancelar [número]*\nExemplo: cancelar 1',
        };
      }

      const requestId = parseInt(parts[1]);
      if (isNaN(requestId)) {
        return {
          isValid: false,
          errorMessage: '❌ ID da solicitação inválido. Use: *cancelar [número]*',
        };
      }

      // Verificar se a solicitação existe e pertence ao usuário
      const request = flowData.requests?.find((r) => r.id === requestId);
      if (!request) {
        return {
          isValid: false,
          errorMessage: '❌ Solicitação não encontrada. Verifique o número e tente novamente.',
        };
      }

      // Verificar se pode ser cancelada
      if (request.status !== ServiceRequestStatus.PENDING) {
        return {
          isValid: false,
          errorMessage: `❌ Apenas solicitações com status "Pendente" podem ser canceladas.\nStatus atual: ${request.status}`,
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
    const flowData = data as ViewServiceRequestFlowDataDTO;
    const input = message.body.trim();

    // Se está confirmando cancelamento
    if (flowData.awaitingCancelConfirmation && input.toLowerCase() === 'confirmar') {
      return await this.handleCancelConfirmation(message, flowData);
    }

    // Se é comando de cancelamento
    if (input.toLowerCase().startsWith('cancelar')) {
      return await this.handleCancelRequest(message, flowData);
    }

    // Se é seleção de número
    const requestNumber = parseInt(input);
    if (!isNaN(requestNumber) && requestNumber >= 1) {
      return await this.handleRequestSelection(message, flowData, requestNumber);
    }

    // Mensagem não reconhecida
    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      `❌ Comando não reconhecido.\n\nDigite o número da solicitação para ver detalhes.\nDigite *${MenuOption.MENU}* para voltar ao menu.`,
    );

    return state;
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    if (!state || !user) return null;

    this.logger.log(`Processing service request view step for ${message.phoneNumber}`);

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
   * Exibe detalhes de uma solicitação selecionada
   */
  private async handleRequestSelection(
    message: ConversationMessageDTO,
    flowData: ViewServiceRequestFlowDataDTO,
    requestNumber: number,
  ): Promise<ConversationStateDTO> {
    const selectedRequest = flowData.requests![requestNumber - 1];

    // Se o serviço está PENDING e tem propostas, redirecionar para visualização de propostas
    if (selectedRequest.status === ServiceRequestStatus.PENDING && 
        selectedRequest.proposalCount && 
        selectedRequest.proposalCount > 0) {
      
      this.logger.log(`Redirecting to proposals view for service request ${selectedRequest.id}`);
      
      // Mensagem informando sobre as propostas
      const proposalsMessage = 
        `🔔 *Propostas Recebidas!*\n\n` +
        `Esta solicitação recebeu ${selectedRequest.proposalCount} proposta(s).\n\n` +
        `Carregando perfis dos profissionais...`;
      
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        proposalsMessage,
      );

      // Mudar estado para viewing_proposals
      return {
        userId: message.phoneNumber,
        state: 'viewing_proposals',
        data: {
          serviceRequestId: selectedRequest.id,
          specialtyName: selectedRequest.specialtyName,
        },
      };
    }

    // Caso contrário, mostrar detalhes normais
    const detailsMessage = this.formatter.formatServiceRequestDetails(
      selectedRequest,
      requestNumber, // Passa a posição na lista
    );
    
    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      detailsMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'viewing_service_requests',
      data: {
        ...flowData,
        selectedRequestId: selectedRequest.id,
      },
    };
  }

  /**
   * Inicia processo de cancelamento
   */
  private async handleCancelRequest(
    message: ConversationMessageDTO,
    flowData: ViewServiceRequestFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const parts = message.body.split(' ');
    const requestNumber = parseInt(parts[1]);

    const request = flowData.requests?.[requestNumber - 1];

    if (!request) {
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Solicitação não encontrada.',
      );
      return {
        userId: message.phoneNumber,
        state: 'viewing_service_requests',
        data: flowData,
      };
    }

    const confirmationMessage = this.formatter.formatCancelConfirmation(
      request.id,
      request.specialtyName,
    );

    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      confirmationMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'viewing_service_requests',
      data: {
        ...flowData,
        selectedRequestId: request.id,
        awaitingCancelConfirmation: true,
      },
    };
  }

  /**
   * Confirma e executa cancelamento
   */
  private async handleCancelConfirmation(
    message: ConversationMessageDTO,
    flowData: ViewServiceRequestFlowDataDTO,
  ): Promise<ConversationStateDTO | null> {
    try {
      const requestId = flowData.selectedRequestId!;
      
      // Buscar a solicitação completa
      const serviceRequest = await this.serviceRequestService.findById(requestId);

      if (!serviceRequest) {
        const errorMessage = this.formatter.formatRequestNotFound();
        await this.whatsappService.sendMessage(
          `${message.phoneNumber}@c.us`,
          errorMessage,
        );
        return null;
      }

      // Atualizar status para CANCELLED
      await this.serviceRequestService.update(
        requestId,
        serviceRequest.getClientId(),
        serviceRequest.getProfessionalId() || null,
        serviceRequest.getSpecialtyId(),
        ServiceRequestStatus.CANCELLED,
        serviceRequest.getDescription() || '',
      );

      // Emitir evento de cancelamento
      const event = new ServiceRequestCancelledEvent(
        serviceRequest.getClientId(),
        message.phoneNumber,
        requestId,
        'client',
        'Cancelado pelo cliente',
      );

      await this.eventEmitter.emit(event);

      this.logger.log(`Service request ${requestId} cancelled by client`);

      // Enviar confirmação
      const successMessage = this.formatter.formatCancelSuccess();
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        successMessage,
      );

      // Finalizar fluxo
      return null;
    } catch (error) {
      this.logger.error(`Error cancelling service request: ${error.message}`, error.stack);

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Ocorreu um erro ao cancelar a solicitação. Por favor, tente novamente mais tarde.',
      );

      return null;
    }
  }
}
