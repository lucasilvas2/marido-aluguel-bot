import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ServiceRequestCreatedEvent } from '../events/service-request/service-request-created.event';
import { ServiceRequestAcceptedEvent } from '../events/service-request/service-request-accepted.event';
import { ServiceRequestCompletedEvent } from '../events/service-request/service-request-completed.event';
import { ServiceRequestProposalCreatedEvent } from '../events/service-request/service-request-proposal-created.event';
import { ServiceRequestProposalAcceptedEvent } from '../events/service-request/service-request-proposal-accepted.event';
import { ServiceRequestProposalRejectedEvent } from '../events/service-request/service-request-proposal-rejected.event';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { UserSpecialtiesServiceInterface } from 'src/domain/specialties/services/user-specialties.service.interface';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';

/**
 * Listener para notificar usuários sobre eventos de solicitação de serviço
 */
@Injectable()
export class ServiceRequestNotificationListener {
  private readonly logger = new Logger(ServiceRequestNotificationListener.name);

  constructor(
    private readonly whatsappService: WhatsappWebService,
    private readonly usersService: UsersServiceInterface,
    private readonly userSpecialtiesService: UserSpecialtiesServiceInterface,
  ) {}

  /**
   * Notifica profissionais disponíveis quando uma nova solicitação é criada
   * Apenas profissionais com a especialidade específica são notificados
   */
  @OnEvent('service-request.created')
  async handleServiceRequestCreated(event: ServiceRequestCreatedEvent): Promise<void> {
    // Validar se o evento tem os dados necessários
    if (!event.specialtyId || !event.specialtyName || !event.description) {
      this.logger.warn(
        `Skipping service-request.created event ${event.eventId} with incomplete data (specialty: ${event.specialtyName}, id: ${event.specialtyId})`
      );
      return;
    }
    
    this.logger.log(
      `Handling service-request.created event: ${event.eventId} for specialty ${event.specialtyName} (ID: ${event.specialtyId})`
    );

    try {
      // Buscar profissionais que têm esta especialidade cadastrada
      const userSpecialties = await this.userSpecialtiesService.findBySpecialtyId(event.specialtyId);

      if (userSpecialties.length === 0) {
        this.logger.warn(
          `No professionals found with specialty ${event.specialtyName} (ID: ${event.specialtyId})`
        );
        return;
      }

      this.logger.debug(
        `Found ${userSpecialties.length} professionals with specialty ${event.specialtyName} to notify`
      );

      // Notificar cada profissional que tem a especialidade
      let notifiedCount = 0;
      for (const userSpecialty of userSpecialties) {
        try {
          const professional = await this.usersService.findById(userSpecialty.getUserId());
          
          if (!professional) {
            this.logger.warn(`Professional with ID ${userSpecialty.getUserId()} not found`);
            continue;
          }

          // Verificar se realmente é profissional
          if (professional.getUserType() !== UserType.PROFESSIONAL) {
            this.logger.warn(
              `User ${professional.getId()} has specialty but is not a professional`
            );
            continue;
          }

          const message = 
            `🔔 *Nova Solicitação de Serviço!*\n\n` +
            `🛠 Especialidade: *${event.specialtyName}*\n` +
            `📝 Descrição: ${event.description}\n\n` +
            `Para aceitar esta solicitação, acesse o menu de solicitações disponíveis.\n\n` +
            `Digite *${0}* para ver o menu.`;

          await this.whatsappService.sendMessage(
            `${professional.getWhatsappNumber()}@c.us`,
            message
          );

          notifiedCount++;
          this.logger.debug(
            `Notification sent to professional ${professional.getId()} (${professional.getName()})`
          );
        } catch (error) {
          this.logger.error(
            `Failed to notify professional ${userSpecialty.getUserId()}: ${error.message}`,
            error.stack
          );
        }
      }

      this.logger.log(
        `Successfully notified ${notifiedCount} professionals for service request ${event.serviceRequestId}`
      );
    } catch (error) {
      this.logger.error(
        `Error handling service-request.created event: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Notifica o cliente quando um profissional aceita sua solicitação
   */
  @OnEvent('service-request.accepted')
  async handleServiceRequestAccepted(event: ServiceRequestAcceptedEvent): Promise<void> {
    this.logger.log(
      `Handling service-request.accepted event: ${event.eventId} by professional ${event.professionalName}`
    );

    try {
      const message = 
        `✅ *Solicitação Aceita!*\n\n` +
        `Ótima notícia! O profissional *${event.professionalName}* aceitou sua solicitação de serviço.\n\n` +
        `Em breve ele entrará em contato com você para agendar o atendimento.\n\n` +
        `Digite *${0}* para voltar ao menu.`;

      await this.whatsappService.sendMessage(
        `${event.clientPhoneNumber}@c.us`,
        message
      );

      this.logger.log(`Client notified about accepted service request ${event.serviceRequestId}`);
    } catch (error) {
      this.logger.error(
        `Error notifying client about accepted service request: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Notifica o cliente quando o serviço é concluído
   */
  @OnEvent('service-request.completed')
  async handleServiceRequestCompleted(event: ServiceRequestCompletedEvent): Promise<void> {
    this.logger.log(
      `Handling service-request.completed event: ${event.eventId}`
    );

    try {
      const user = await this.usersService.findById(event.clientId);
      
      if (!user) {
        this.logger.warn(`Client ${event.clientId} not found for completed service notification`);
        return;
      }

      const message = 
        `✅ *Serviço Concluído!*\n\n` +
        `Seu serviço foi marcado como concluído.\n\n` +
        `Esperamos que tudo tenha corrido bem!\n\n` +
        `Digite *${0}* para voltar ao menu.`;

      await this.whatsappService.sendMessage(
        `${user.getWhatsappNumber()}@c.us`,
        message
      );

      this.logger.log(`Client notified about completed service request ${event.serviceRequestId}`);
    } catch (error) {
      this.logger.error(
        `Error notifying client about completed service request: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Notifica o cliente quando um profissional cria uma proposta
   */
  @OnEvent('service-request-proposal.created')
  async handleProposalCreated(event: ServiceRequestProposalCreatedEvent): Promise<void> {
    this.logger.log(
      `Handling service-request-proposal.created event: ${event.eventId} by professional ${event.professionalName}`
    );

    try {
      const message = 
        `🔔 *Nova Proposta Recebida!*\n\n` +
        `O profissional *${event.professionalName}* se interessou pelo seu serviço.\n\n` +
        `Digite *2* (Meus Pedidos) para ver o perfil do profissional e decidir.\n\n` +
        `Digite *${0}* para voltar ao menu.`;

      await this.whatsappService.sendMessage(
        `${event.clientPhoneNumber}@c.us`,
        message
      );

      this.logger.log(`Client notified about new proposal ${event.proposalId} for service request ${event.serviceRequestId}`);
    } catch (error) {
      this.logger.error(
        `Error notifying client about new proposal: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Notifica o profissional quando sua proposta é aceita pelo cliente
   */
  @OnEvent('service-request-proposal.accepted')
  async handleProposalAccepted(event: ServiceRequestProposalAcceptedEvent): Promise<void> {
    this.logger.log(
      `Handling service-request-proposal.accepted event: ${event.eventId} for proposal ${event.proposalId}`
    );

    try {
      const professional = await this.usersService.findById(event.professionalId);
      const client = await this.usersService.findById(event.clientId);

      if (!professional || !client) {
        this.logger.warn(`Professional ${event.professionalId} or client ${event.clientId} not found`);
        return;
      }

      const message = 
        `🎉 *Parabéns! Você foi selecionado!*\n\n` +
        `O cliente *${client.getName()}* escolheu você para realizar o serviço.\n\n` +
        `📱 *Contato do Cliente:*\n` +
        `Nome: ${client.getName()}\n` +
        `Telefone: ${client.getWhatsappNumber()}\n\n` +
        `Entre em contato para agendar o serviço!\n\n` +
        `Digite *3* para ver seus serviços aceitos.\n` +
        `Digite *${0}* para voltar ao menu.`;

      await this.whatsappService.sendMessage(
        `${professional.getWhatsappNumber()}@c.us`,
        message
      );

      this.logger.log(`Professional ${event.professionalId} notified about accepted proposal ${event.proposalId}`);
    } catch (error) {
      this.logger.error(
        `Error notifying professional about accepted proposal: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Notifica o profissional quando sua proposta é rejeitada
   */
  @OnEvent('service-request-proposal.rejected')
  async handleProposalRejected(event: ServiceRequestProposalRejectedEvent): Promise<void> {
    this.logger.log(
      `Handling service-request-proposal.rejected event: ${event.eventId} for proposal ${event.proposalId}`
    );

    try {
      const professional = await this.usersService.findById(event.professionalId);

      if (!professional) {
        this.logger.warn(`Professional ${event.professionalId} not found for rejected proposal notification`);
        return;
      }

      const message = 
        `ℹ️ *Atualização de Proposta*\n\n` +
        `O cliente escolheu outro profissional para este serviço.\n\n` +
        `Não desanime! Continue disponível e novas oportunidades surgirão em breve.\n\n` +
        `💡 *Dica:* Profissionais com mais experiência e certificação têm maior chance de serem escolhidos.\n\n` +
        `Digite *${0}* para voltar ao menu.`;

      await this.whatsappService.sendMessage(
        `${professional.getWhatsappNumber()}@c.us`,
        message
      );

      this.logger.log(`Professional ${event.professionalId} notified about rejected proposal ${event.proposalId}`);
    } catch (error) {
      this.logger.error(
        `Error notifying professional about rejected proposal: ${error.message}`,
        error.stack
      );
    }
  }
}
