import { Injectable, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { ProfessionalServiceRequestFormatter, AvailableServiceRequestDTO } from '../formatters/professional-service-request.formatter';
import { ServiceRequestAppServiceInterface } from 'src/application/service-request/interfaces/service-request.app.service.interfaces';
import { SpecialtiesAppServiceInterface } from 'src/application/specialties/interfaces/specialties.app.service.interface';
import { UserSpecialtiesServiceInterface } from 'src/domain/specialties/services/user-specialties.service.interface';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { ProfessionalMenuOption } from '../enums/menu-option.enum';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';
import { ServiceRequestStatus } from 'src/domain/service-requests/enums/service-request-status.enum';

/**
 * Handler para visualizar solicitações disponíveis para o profissional
 * Processa comando "Ver Solicitações" do menu profissional
 */
@Injectable()
export class ViewAvailableServiceRequestsHandler implements ICommandHandler {
  private readonly logger = new Logger(ViewAvailableServiceRequestsHandler.name);

  constructor(
    private readonly formatter: ProfessionalServiceRequestFormatter,
    private readonly serviceRequestService: ServiceRequestAppServiceInterface,
    private readonly specialtiesService: SpecialtiesAppServiceInterface,
    private readonly userSpecialtiesService: UserSpecialtiesServiceInterface,
    private readonly usersService: UsersServiceInterface,
    private readonly whatsappService: WhatsappWebService,
  ) {}

  getHandlerName(): string {
    return 'ViewAvailableServiceRequestsHandler';
  }

  getCommands(): string[] {
    return [
      ProfessionalMenuOption.VER_SOLICITACOES,
      'ver solicitacoes',
      'ver solicitações',
      'solicitacoes',
      'solicitações',
      'servicos disponiveis',
      'serviços disponíveis',
    ];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    // Apenas profissionais registrados podem ver solicitações
    if (!user) return false;
    
    // Verifica se é um profissional
    if (user.getUserType() !== UserType.PROFESSIONAL) return false;

    // Não inicia se já está em um fluxo
    if (state && state.state !== 'idle') return false;

    const lowerBody = messageBody.toLowerCase().trim();
    return this.getCommands().some((cmd) => 
      lowerBody === cmd.toLowerCase() || lowerBody.includes(cmd.toLowerCase())
    );
  }

  canExecute(user: User | null, command: string): boolean {
    // Apenas profissionais podem executar
    return user !== null && user.getUserType() === UserType.PROFESSIONAL;
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
      `Displaying available service requests for professional ${user.getId()} (${message.phoneNumber})`,
    );

    try {
      // Buscar especialidades do profissional
      const userSpecialties = await this.userSpecialtiesService.findByUserId(user.getId());

      if (userSpecialties.length === 0) {
        const errorMessage = this.formatter.formatNoSpecialtiesError();
        await this.whatsappService.sendMessage(
          `${message.phoneNumber}@c.us`,
          errorMessage,
        );
        return null;
      }

      // Extrair IDs das especialidades
      const specialtyIds = userSpecialties.map(us => us.getSpecialtyId());
      
      // Buscar nomes das especialidades
      const specialtyNames = await Promise.all(
        specialtyIds.map(async (id) => {
          const specialty = await this.specialtiesService.getById(id);
          return specialty?.getName() || '';
        })
      );

      this.logger.debug(`Professional has ${specialtyIds.length} specialties`);

      // Buscar solicitações pendentes para essas especialidades
      const allAvailableRequests = await Promise.all(
        specialtyIds.map(async (specialtyId) => {
          return await this.serviceRequestService.findBySpecialtyId(specialtyId);
        })
      );

      // Flatten e filtrar apenas PENDING
      const flatRequests = allAvailableRequests.flat();
      const pendingRequests = flatRequests.filter(
        sr => sr.getStatus() === ServiceRequestStatus.PENDING
      );

      this.logger.debug(`Found ${pendingRequests.length} pending service requests`);

      const displayRequests: AvailableServiceRequestDTO[] = await Promise.all(
        pendingRequests.map(async (sr) => {
          const specialty = await this.specialtiesService.getById(sr.getSpecialtyId());
          const client = await this.usersService.findById(sr.getClientId());

          return {
            id: sr.getId(),
            specialtyName: specialty?.getName() || 'Especialidade não encontrada',
            clientName: client?.getName() || 'Cliente não encontrado',
            description: sr.getDescription() || 'Sem descrição',
            status: sr.getStatus(),
            createdAt: sr.getCreatedAt(),
          };
        })
      );

      // Ordenar por data (mais recentes primeiro)
      displayRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Formatar e enviar mensagem
      const responseMessage = this.formatter.formatAvailableServiceRequestsList(
        displayRequests,
        user.getName(),
        specialtyNames.filter(n => n !== ''),
      );

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        responseMessage,
      );

      // Se tem solicitações, entrar em estado de visualização
      if (displayRequests.length > 0) {
        return {
          userId: message.phoneNumber,
          state: 'viewing_available_requests',
          data: { requests: displayRequests },
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error displaying available service requests for professional ${user.getId()}: ${error.message}`,
        error.stack,
      );

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Ocorreu um erro ao buscar as solicitações. Por favor, tente novamente mais tarde.',
      );

      return null;
    }
  }
}
