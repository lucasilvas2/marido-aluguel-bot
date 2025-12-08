import { Injectable } from '@nestjs/common';
import { ServiceRequest } from 'src/domain/service-requests/entities/service-request';
import { ServiceRequestStatusLabel } from 'src/domain/service-requests/enums/service-request-status.enum';
import { MenuOption } from '../enums/menu-option.enum';

/**
 * DTO para exibir solicitação de serviço com dados relacionados
 */
export interface ServiceRequestDisplayDTO {
  id: number;
  specialtyName: string;
  status: string;
  description: string;
  professionalName?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Formatador de mensagens para visualização de solicitações de serviço
 */
@Injectable()
export class ServiceRequestViewMessageFormatter {
  /**
   * Formata lista de solicitações do cliente
   */
  formatClientServiceRequestsList(
    requests: ServiceRequestDisplayDTO[],
    userName: string,
  ): string {
    if (requests.length === 0) {
      return (
        `📦 *Minhas Solicitações*\n\n` +
        `Olá, ${userName}!\n\n` +
        `Você ainda não tem solicitações de serviço cadastradas.\n\n` +
        `Para solicitar um serviço, digite *1* no menu principal.\n\n` +
        `Digite *${MenuOption.MENU}* para voltar ao menu.`
      );
    }

    let message =
      `📦 *Minhas Solicitações*\n\n` +
      `Olá, ${userName}!\n\n` +
      `Aqui estão suas solicitações:\n\n`;

    requests.forEach((request, index) => {
      const statusLabel = this.getStatusLabel(request.status);
      const statusEmoji = this.getStatusEmoji(request.status);
      
      message += `${index + 1}. ${statusEmoji} *${request.specialtyName}*\n`;
      message += `   Status: ${statusLabel}\n`;
      message += `   Descrição: ${this.truncateText(request.description, 60)}\n`;
      
      if (request.professionalName) {
        message += `   Profissional: ${request.professionalName}\n`;
      }
      
      message += `   Solicitado em: ${this.formatDate(request.createdAt)}\n\n`;
    });

    message += `💡 Para ver detalhes, digite o número da solicitação.\n`;
    message += `Digite *${MenuOption.MENU}* para voltar ao menu.`;

    return message;
  }

  /**
   * Formata detalhes completos de uma solicitação
   */
  formatServiceRequestDetails(request: ServiceRequestDisplayDTO): string {
    const statusLabel = this.getStatusLabel(request.status);
    const statusEmoji = this.getStatusEmoji(request.status);

    let message =
      `📋 *Detalhes da Solicitação #${request.id}*\n\n` +
      `${statusEmoji} *Status:* ${statusLabel}\n\n` +
      `🛠️ *Especialidade:* ${request.specialtyName}\n\n` +
      `📝 *Descrição:*\n${request.description}\n\n`;

    if (request.professionalName) {
      message += `👨‍🔧 *Profissional:* ${request.professionalName}\n\n`;
    } else {
      message += `⏳ *Aguardando profissional aceitar...*\n\n`;
    }

    message += `📅 *Solicitado em:* ${this.formatDate(request.createdAt)}\n`;
    message += `🔄 *Última atualização:* ${this.formatDate(request.updatedAt)}\n\n`;

    // Ações disponíveis baseadas no status
    if (request.status === 'PENDING') {
      message += `💡 *Ações disponíveis:*\n`;
      message += `Digite *cancelar ${request.id}* para cancelar esta solicitação\n\n`;
    }

    message += `Digite *${MenuOption.MENU}* para voltar ao menu.`;

    return message;
  }

  /**
   * Formata mensagem de cancelamento de solicitação
   */
  formatCancelConfirmation(requestId: number, specialtyName: string): string {
    return (
      `⚠️ *Cancelar Solicitação #${requestId}*\n\n` +
      `Você tem certeza que deseja cancelar a solicitação de:\n` +
      `*${specialtyName}*?\n\n` +
      `Esta ação não pode ser desfeita.\n\n` +
      `Digite *confirmar* para cancelar a solicitação\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata mensagem de sucesso no cancelamento
   */
  formatCancelSuccess(): string {
    return (
      `✅ *Solicitação Cancelada*\n\n` +
      `Sua solicitação foi cancelada com sucesso.\n\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata mensagem quando solicitação não é encontrada
   */
  formatRequestNotFound(): string {
    return (
      `❌ *Solicitação não encontrada*\n\n` +
      `A solicitação informada não foi encontrada ou não pertence a você.\n\n` +
      `Digite *2* no menu para ver suas solicitações.\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Obtém label do status em português
   */
  private getStatusLabel(status: string): string {
    return ServiceRequestStatusLabel[status] || status;
  }

  /**
   * Obtém emoji representativo do status
   */
  private getStatusEmoji(status: string): string {
    const emojiMap: Record<string, string> = {
      PENDING: '⏳',
      ACCEPTED: '✅',
      IN_PROGRESS: '🔧',
      COMPLETED: '✔️',
      CANCELLED: '❌',
    };
    return emojiMap[status] || '📄';
  }

  /**
   * Trunca texto longo
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Formata data para exibição
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  }
}
