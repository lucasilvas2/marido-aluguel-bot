import { Injectable, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { ProfessionalServiceRequestFormatter, AcceptedServiceRequestDTO } from '../formatters/professional-service-request.formatter';
import { ServiceRequestAppServiceInterface } from 'src/application/service-request/interfaces/service-request.app.service.interfaces';
import { SpecialtiesAppServiceInterface } from 'src/application/specialties/interfaces/specialties.app.service.interface';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';

/**
 * Handler para visualizar serviços aceitos pelo profissional
 * Comando alternativo: "meus serviços", "trabalhos aceitos"
 */
@Injectable()
export class ViewAcceptedServiceRequestsHandler implements ICommandHandler {
  private readonly logger = new Logger(ViewAcceptedServiceRequestsHandler.name);

  constructor(
    private readonly formatter: ProfessionalServiceRequestFormatter,
    private readonly serviceRequestService: ServiceRequestAppServiceInterface,
    private readonly specialtiesService: SpecialtiesAppServiceInterface,
    private readonly usersService: UsersServiceInterface,
    private readonly whatsappService: WhatsappWebService,
  ) {}

  getHandlerName(): string {
    return 'ViewAcceptedServiceRequestsHandler';
  }

  getCommands(): string[] {
    return [
      'meus servicos',
      'meus serviços',
      'servicos aceitos',
      'serviços aceitos',
      'trabalhos aceitos',
      'meus trabalhos',
    ];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    // Apenas profissionais registrados podem ver seus serviços
    if (!user) return false;
    
    // Verifica se é um profissional
    if (user.getUserType() !== UserType.PROFESSIONAL) return false;

    // Não inicia se já está em um fluxo
    if (state && state.state !== 'idle') return false;

    const lowerBody = messageBody.toLowerCase().trim();
    return this.getCommands().some((cmd) => 
      lowerBody.includes(cmd.toLowerCase())
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
      this.logger.warn(`Non-registered user ${message.phoneNumber} tried to view accepted services`);
      return null;
    }

    this.logger.log(
      `Displaying accepted service requests for professional ${user.getId()} (${message.phoneNumber})`,
    );

    try {
      // Buscar todas as solicitações do profissional
      const serviceRequests = await this.serviceRequestService.findByProfessionalId(user.getId());

      this.logger.debug(`Found ${serviceRequests.length} accepted service requests for professional ${user.getId()}`);

      const displayRequests: AcceptedServiceRequestDTO[] = await Promise.all(
        serviceRequests.map(async (sr) => {
          const specialty = await this.specialtiesService.getById(sr.getSpecialtyId());
          const client = await this.usersService.findById(sr.getClientId());

          return {
            id: sr.getId(),
            specialtyName: specialty?.getName() || 'Especialidade não encontrada',
            clientName: client?.getName() || 'Cliente não encontrado',
            clientPhone: client?.getWhatsappNumber() || '',
            description: sr.getDescription() || 'Sem descrição',
            status: sr.getStatus(),
            createdAt: sr.getCreatedAt(),
            updatedAt: sr.getUpdatedAt(),
          };
        })
      );

      displayRequests.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      const responseMessage = this.formatter.formatAcceptedServiceRequestsList(
        displayRequests,
        user.getName(),
      );

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        responseMessage,
      );

      if (displayRequests.length > 0) {
        return {
          userId: message.phoneNumber,
          state: 'managing_accepted_requests',
          data: { requests: displayRequests },
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error displaying accepted service requests for professional ${user.getId()}: ${error.message}`,
        error.stack,
      );

      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        '❌ Ocorreu um erro ao buscar seus serviços. Por favor, tente novamente mais tarde.',
      );

      return null;
    }
  }
}
