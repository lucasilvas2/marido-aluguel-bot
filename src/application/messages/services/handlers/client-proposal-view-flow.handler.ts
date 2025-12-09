import { Injectable, Logger } from '@nestjs/common';
import { IConversationFlowHandler } from './interfaces/conversation-flow-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { ClientProposalMessageFormatter, ProfessionalProposalDTO } from '../formatters/client-proposal-message.formatter';
import { ServiceRequestAppServiceInterface } from 'src/application/service-request/interfaces/service-request.app.service.interfaces';
import { ServiceRequestProposalAppServiceInterface } from 'src/application/service-request/interfaces/service-request-proposal.app.service.interface';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { SpecialtiesAppServiceInterface } from 'src/application/specialties/interfaces/specialties.app.service.interface';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { MenuOption } from '../enums/menu-option.enum';

/**
 * DTO para dados do fluxo
 */
interface ViewProposalsFlowDataDTO {
  serviceRequestId: number;
  specialtyName: string;
  proposals?: ProfessionalProposalDTO[];
  selectedProposalId?: number;
  awaitingApprovalConfirmation?: boolean;
}

/**
 * Handler para cliente visualizar e aprovar propostas
 */
@Injectable()
export class ClientProposalViewFlowHandler implements IConversationFlowHandler {
  private readonly logger = new Logger(ClientProposalViewFlowHandler.name);

  constructor(
    private readonly formatter: ClientProposalMessageFormatter,
    private readonly serviceRequestService: ServiceRequestAppServiceInterface,
    private readonly proposalService: ServiceRequestProposalAppServiceInterface,
    private readonly usersService: UsersServiceInterface,
    private readonly specialtiesService: SpecialtiesAppServiceInterface,
    private readonly whatsappService: WhatsappWebService,
  ) {}

  getHandlerName(): string {
    return 'ClientProposalViewFlowHandler';
  }

  getHandledStates(): string[] {
    return ['viewing_proposals'];
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
    const flowData = data as ViewProposalsFlowDataDTO;

    // Se está aguardando confirmação
    if (flowData.awaitingApprovalConfirmation) {
      const normalized = input.toLowerCase().trim();
      if (normalized !== 'confirmar' && normalized !== MenuOption.MENU && normalized !== '0') {
        return {
          isValid: false,
          errorMessage: `❌ Opção inválida. Digite *confirmar* para aprovar ou *${MenuOption.MENU}* para voltar.`,
        };
      }
      return { isValid: true };
    }

    // Validação de comando aprovar
    if (input.toLowerCase().startsWith('aprovar')) {
      const parts = input.split(' ');
      if (parts.length < 2) {
        return {
          isValid: false,
          errorMessage: '❌ Use o formato: *aprovar [número]*\nExemplo: aprovar 1',
        };
      }

      const proposalNumber = parseInt(parts[1]);
      if (isNaN(proposalNumber)) {
        return {
          isValid: false,
          errorMessage: '❌ Número da proposta inválido. Use: *aprovar [número]*',
        };
      }

      if (proposalNumber < 1 || proposalNumber > (flowData.proposals?.length || 0)) {
        return {
          isValid: false,
          errorMessage: `❌ Número inválido. Escolha entre 1 e ${flowData.proposals?.length || 0}.`,
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
    const flowData = data as ViewProposalsFlowDataDTO;
    const input = message.body.toLowerCase().trim();

    // Se está confirmando aprovação
    if (flowData.awaitingApprovalConfirmation && input === 'confirmar') {
      return await this.handleApprovalConfirmation(message, flowData);
    }

    // Se é comando voltar
    if (input === 'voltar') {
      // Recarregar lista de propostas
      return await this.loadProposals(message.phoneNumber, flowData.serviceRequestId, flowData.specialtyName);
    }

    // Se é comando de aprovação
    if (input.startsWith('aprovar')) {
      return await this.handleApproveRequest(message, flowData);
    }

    // Se é seleção de número
    const proposalNumber = parseInt(message.body.trim());
    if (!isNaN(proposalNumber) && proposalNumber >= 1 && proposalNumber <= (flowData.proposals?.length || 0)) {
      return await this.handleProposalSelection(message, flowData, proposalNumber);
    }

    // Mensagem não reconhecida
    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      `❌ Comando não reconhecido.\n\nDigite o número para ver perfil do profissional.\nDigite *aprovar [número]* para selecionar.\nDigite *${MenuOption.MENU}* para voltar ao menu.`,
    );

    return state;
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    if (!state || !user) return null;

    this.logger.log(`Processing proposals view step for ${message.phoneNumber}`);

    const flowData = state.data as ViewProposalsFlowDataDTO;

    // Se não tem propostas carregadas ainda, carregar primeiro
    if (!flowData.proposals) {
      this.logger.log(`Loading proposals for service request ${flowData.serviceRequestId}`);
      return await this.loadProposals(
        message.phoneNumber,
        flowData.serviceRequestId,
        flowData.specialtyName,
      );
    }

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
   * Carrega propostas de um serviço
   */
  private async loadProposals(
    phoneNumber: string,
    serviceRequestId: number,
    specialtyName: string,
  ): Promise<ConversationStateDTO> {
    // Buscar propostas pendentes
    const proposals = await this.proposalService.findPendingByServiceRequestId(serviceRequestId);

    // Enriquecer com dados do profissional
    const proposalDTOs: ProfessionalProposalDTO[] = await Promise.all(
      proposals.map(async (proposal) => {
        const professional = await this.usersService.findById(proposal.getProfessionalId());
        const stats = await this.proposalService.getProfessionalStats(proposal.getProfessionalId());

        return {
          proposalId: proposal.getId(),
          professionalId: proposal.getProfessionalId(),
          professionalName: professional?.getName() || 'Profissional',
          professionalPhone: professional?.getWhatsappNumber() || '',
          specialtyName: specialtyName,
          experienceYears: stats.experienceYears,
          pricePerHour: stats.pricePerHour,
          isCertified: stats.isCertified,
          completedServicesCount: stats.completedServicesCount,
          proposedAt: proposal.getProposedAt(),
        };
      }),
    );

    // Formatar e enviar lista
    const message = this.formatter.formatProposalsList(
      serviceRequestId,
      specialtyName,
      proposalDTOs,
    );

    await this.whatsappService.sendMessage(`${phoneNumber}@c.us`, message);

    return {
      userId: phoneNumber,
      state: 'viewing_proposals',
      data: {
        serviceRequestId,
        specialtyName,
        proposals: proposalDTOs,
      },
    };
  }

  /**
   * Exibe detalhes de uma proposta selecionada
   */
  private async handleProposalSelection(
    message: ConversationMessageDTO,
    flowData: ViewProposalsFlowDataDTO,
    proposalNumber: number,
  ): Promise<ConversationStateDTO> {
    const selectedProposal = flowData.proposals![proposalNumber - 1];

    const detailsMessage = this.formatter.formatProfessionalProfile(
      selectedProposal,
      proposalNumber,
    );

    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      detailsMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'viewing_proposals',
      data: {
        ...flowData,
        selectedProposalId: selectedProposal.proposalId,
      },
    };
  }

  /**
   * Inicia processo de aprovação
   */
  private async handleApproveRequest(
    message: ConversationMessageDTO,
    flowData: ViewProposalsFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const input = message.body.trim();
    const parts = input.split(' ');
    const proposalNumber = parseInt(parts[1]);

    const proposal = flowData.proposals?.[proposalNumber - 1];

    if (!proposal) {
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Proposta não encontrada.',
      );
      return {
        userId: message.phoneNumber,
        state: 'viewing_proposals',
        data: flowData,
      };
    }

    const confirmationMessage = this.formatter.formatApprovalConfirmation(
      proposal.professionalName,
      flowData.specialtyName,
    );

    await this.whatsappService.sendMessage(
      `${message.phoneNumber}@c.us`,
      confirmationMessage,
    );

    return {
      userId: message.phoneNumber,
      state: 'viewing_proposals',
      data: {
        ...flowData,
        selectedProposalId: proposal.proposalId,
        awaitingApprovalConfirmation: true,
      },
    };
  }

  /**
   * Confirma e executa aprovação
   */
  private async handleApprovalConfirmation(
    message: ConversationMessageDTO,
    flowData: ViewProposalsFlowDataDTO,
  ): Promise<ConversationStateDTO | null> {
    try {
      const proposalId = flowData.selectedProposalId!;
      const serviceRequestId = flowData.serviceRequestId;

      // Aceitar proposta (isso também rejeita outras automaticamente)
      await this.proposalService.acceptProposal(proposalId, serviceRequestId);

      // Buscar dados do profissional para exibir
      const proposal = flowData.proposals?.find(p => p.proposalId === proposalId);

      this.logger.log(`Proposal ${proposalId} approved by client for service request ${serviceRequestId}`);

      // Enviar confirmação
      const successMessage = this.formatter.formatApprovalSuccess(
        proposal?.professionalName || 'Profissional',
        proposal?.professionalPhone || '',
      );

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        successMessage,
      );

      // Finalizar fluxo
      return null;
    } catch (error) {
      this.logger.error(`Error approving proposal: ${error.message}`, error.stack);

      let errorMessage = '❌ Ocorreu um erro ao aprovar a proposta. Por favor, tente novamente mais tarde.';

      if (error.message.includes('não está mais disponível')) {
        errorMessage = '❌ Esta proposta não está mais disponível.';
      }

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        errorMessage,
      );

      return null;
    }
  }
}
