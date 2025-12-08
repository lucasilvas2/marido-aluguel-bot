import { Injectable, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { ServiceRequestViewMessageFormatter, ServiceRequestDisplayDTO } from '../formatters/service-request-view-message.formatter';
import { ServiceRequestAppServiceInterface } from 'src/application/service-request/interfaces/service-request.app.service.interfaces';
import { SpecialtiesAppServiceInterface } from 'src/application/specialties/interfaces/specialties.app.service.interface';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { ClientMenuOption } from '../enums/menu-option.enum';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';

/**
 * Handler para visualizar solicitações de serviço do cliente
 * Processa comando "Meus Pedidos" do menu do cliente
 */
@Injectable()
export class ViewServiceRequestsHandler implements ICommandHandler {
  private readonly logger = new Logger(ViewServiceRequestsHandler.name);

  constructor(
    private readonly formatter: ServiceRequestViewMessageFormatter,
    private readonly serviceRequestService: ServiceRequestAppServiceInterface,
    private readonly specialtiesService: SpecialtiesAppServiceInterface,
    private readonly usersService: UsersServiceInterface,
    private readonly whatsappService: WhatsappWebService,
  ) {}

  getHandlerName(): string {
    return 'ViewServiceRequestsHandler';
  }

  getCommands(): string[] {
    return [
      ClientMenuOption.MEUS_PEDIDOS,
      'meus pedidos',
      'pedidos',
      'solicitacoes',
      'solicitações',
      'minhas solicitacoes',
      'minhas solicitações',
    ];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    // Apenas clientes registrados podem ver seus pedidos
    if (!user) return false;
    
    // Verifica se é um cliente
    if (user.getUserType() !== UserType.CLIENT) return false;

    // Não inicia se já está em um fluxo
    if (state && state.state !== 'idle') return false;

    const lowerBody = messageBody.toLowerCase().trim();
    return this.getCommands().some((cmd) => 
      lowerBody === cmd.toLowerCase() || lowerBody.includes(cmd.toLowerCase())
    );
  }

  canExecute(user: User | null, command: string): boolean {
    // Apenas clientes podem executar
    return user !== null && user.getUserType() === UserType.CLIENT;
  }

  async execute(command: string, user: User | null, args?: Record<string, any>): Promise<string> {
    // Implementação no handle
    return '';
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    if (!user) {
      this.logger.warn(`Non-registered user ${message.phoneNumber} tried to view service requests`);
      return null;
    }

    this.logger.log(
      `Displaying service requests for client ${user.getId()} (${message.phoneNumber})`,
    );

    try {
      // Buscar todas as solicitações do cliente
      const serviceRequests = await this.serviceRequestService.findByClientId(user.getId());

      this.logger.debug(`Found ${serviceRequests.length} service requests for client ${user.getId()}`);

      // Enriquecer dados com especialidade e profissional
      const displayRequests: ServiceRequestDisplayDTO[] = await Promise.all(
        serviceRequests.map(async (sr) => {
          const specialty = await this.specialtiesService.getById(sr.getSpecialtyId());
          
          let professionalName: string | undefined;
          if (sr.getProfessionalId()) {
            const professional = await this.usersService.findById(sr.getProfessionalId()!);
            professionalName = professional?.getName();
          }

          return {
            id: sr.getId(),
            specialtyName: specialty?.getName() || 'Especialidade não encontrada',
            status: sr.getStatus(),
            description: sr.getDescription() || 'Sem descrição',
            professionalName,
            createdAt: sr.getCreatedAt(),
            updatedAt: sr.getUpdatedAt(),
          };
        })
      );

      // Formatar e enviar mensagem
      const responseMessage = this.formatter.formatClientServiceRequestsList(
        displayRequests,
        user.getName(),
      );

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        responseMessage,
      );

      // Se tem solicitações, entrar em estado de visualização detalhada
      if (displayRequests.length > 0) {
        return {
          userId: message.phoneNumber,
          state: 'viewing_service_requests',
          data: { requests: displayRequests },
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error displaying service requests for client ${user.getId()}: ${error.message}`,
        error.stack,
      );

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Ocorreu um erro ao buscar suas solicitações. Por favor, tente novamente mais tarde.',
      );

      return null;
    }
  }
}
