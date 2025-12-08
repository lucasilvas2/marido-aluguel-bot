import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ServiceRequestCreatedEvent } from '../events/service-request/service-request-created.event';
import { ServiceRequestAcceptedEvent } from '../events/service-request/service-request-accepted.event';
import { ServiceRequestCompletedEvent } from '../events/service-request/service-request-completed.event';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
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
  ) {}

  /**
   * Notifica profissionais disponíveis quando uma nova solicitação é criada
   */
  @OnEvent('service-request.created')
  async handleServiceRequestCreated(event: ServiceRequestCreatedEvent): Promise<void> {
    this.logger.log(
      `Handling service-request.created event: ${event.eventId} for specialty ${event.specialtyName}`
    );

    try {
      // Buscar todos os profissionais ativos
      const allUsers = await this.usersService.findAll();
      const professionals = allUsers.filter(user => user.getUserType() === UserType.PROFESSIONAL);

      this.logger.debug(`Found ${professionals.length} professionals to notify`);

      // Notificar cada profissional
      for (const professional of professionals) {
        try {
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

          this.logger.debug(`Notification sent to professional ${professional.getId()}`);
        } catch (error) {
          this.logger.error(
            `Failed to notify professional ${professional.getId()}: ${error.message}`,
            error.stack
          );
        }
      }

      this.logger.log(`Successfully processed notifications for service request ${event.serviceRequestId}`);
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
}
