import { Injectable } from '@nestjs/common';
import { ServiceRequest } from 'src/domain/service-requests/entities/service-request';
import { ServiceRequestStatusLabel } from 'src/domain/service-requests/enums/service-request-status.enum';
import { MenuOption } from '../enums/menu-option.enum';

/**
 * DTO para exibir solicitação disponível para profissional
 */
export interface AvailableServiceRequestDTO {
  id: number;
  specialtyName: string;
  clientName: string;
  description: string;
  status: string;
  createdAt: Date;
  distance?: string; // Futura implementação de geolocalização
}

/**
 * DTO para exibir solicitação aceita pelo profissional
 */
export interface AcceptedServiceRequestDTO {
  id: number;
  specialtyName: string;
  clientName: string;
  clientPhone: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Formatador de mensagens para profissionais visualizarem solicitações
 */
@Injectable()
export class ProfessionalServiceRequestFormatter {
  /**
   * Formata lista de solicitações disponíveis para o profissional
   */
  formatAvailableServiceRequestsList(
    requests: AvailableServiceRequestDTO[],
    professionalName: string,
    specialties: string[],
  ): string {
    if (requests.length === 0) {
      return (
        `📋 *Solicitações Disponíveis*\n\n` +
        `Olá, ${professionalName}!\n\n` +
        `No momento, não há solicitações disponíveis para suas especialidades:\n` +
        `${specialties.map(s => `• ${s}`).join('\n')}\n\n` +
        `Assim que houver novas solicitações, você será notificado.\n\n` +
        `Digite *${MenuOption.MENU}* para voltar ao menu.`
      );
    }

    let message =
      `📋 *Solicitações Disponíveis*\n\n` +
      `Olá, ${professionalName}!\n\n` +
      `Aqui estão as solicitações aguardando profissionais:\n\n`;

    requests.forEach((request, index) => {
      message += `${index + 1}. 🛠️ *${request.specialtyName}*\n`;
      message += `   Cliente: ${request.clientName}\n`;
      message += `   Descrição: ${this.truncateText(request.description, 60)}\n`;
      message += `   Solicitado há: ${this.getTimeAgo(request.createdAt)}\n\n`;
    });

    message += `💡 Para ver detalhes e aceitar, digite o número da solicitação.\n`;
    message += `Digite *${MenuOption.MENU}* para voltar ao menu.`;

    return message;
  }

  /**
   * Formata detalhes de uma solicitação disponível
   */
  formatAvailableServiceRequestDetails(
    request: AvailableServiceRequestDTO,
    listPosition: number,
  ): string {
    let message =
      `📋 *Detalhes da Solicitação #${request.id}*\n\n` +
      `🛠️ *Especialidade:* ${request.specialtyName}\n\n` +
      `👤 *Cliente:* ${request.clientName}\n\n` +
      `📝 *Descrição do Problema:*\n${request.description}\n\n` +
      `📅 *Solicitado há:* ${this.getTimeAgo(request.createdAt)}\n\n`;

    message += `💰 *Aceitar esta solicitação?*\n\n`;
    message += `Digite *aceitar ${listPosition}* para aceitar\n`;
    message += `Digite *${MenuOption.MENU}* para voltar ao menu.`;

    return message;
  }

  /**
   * Formata lista de serviços aceitos pelo profissional
   */
  formatAcceptedServiceRequestsList(
    requests: AcceptedServiceRequestDTO[],
    professionalName: string,
  ): string {
    if (requests.length === 0) {
      return (
        `✅ *Meus Serviços Aceitos*\n\n` +
        `Olá, ${professionalName}!\n\n` +
        `Você ainda não aceitou nenhuma solicitação de serviço.\n\n` +
        `Para ver solicitações disponíveis, digite *2* no menu principal.\n\n` +
        `Digite *${MenuOption.MENU}* para voltar ao menu.`
      );
    }

    let message =
      `✅ *Meus Serviços Aceitos*\n\n` +
      `Olá, ${professionalName}!\n\n` +
      `Aqui estão seus serviços:\n\n`;

    requests.forEach((request, index) => {
      const statusEmoji = this.getStatusEmoji(request.status);
      const statusLabel = ServiceRequestStatusLabel[request.status] || request.status;
      
      message += `${index + 1}. ${statusEmoji} *${request.specialtyName}*\n`;
      message += `   Cliente: ${request.clientName}\n`;
      message += `   Status: ${statusLabel}\n`;
      message += `   Descrição: ${this.truncateText(request.description, 60)}\n`;
      message += `   Aceito em: ${this.formatDate(request.createdAt)}\n\n`;
    });

    message += `💡 Para ver detalhes, digite o número do serviço.\n`;
    message += `Digite *${MenuOption.MENU}* para voltar ao menu.`;

    return message;
  }

  /**
   * Formata detalhes de um serviço aceito
   */
  formatAcceptedServiceRequestDetails(
    request: AcceptedServiceRequestDTO,
    listPosition: number,
  ): string {
    const statusLabel = ServiceRequestStatusLabel[request.status] || request.status;
    const statusEmoji = this.getStatusEmoji(request.status);

    let message =
      `📋 *Detalhes do Serviço #${request.id}*\n\n` +
      `${statusEmoji} *Status:* ${statusLabel}\n\n` +
      `🛠️ *Especialidade:* ${request.specialtyName}\n\n` +
      `👤 *Cliente:* ${request.clientName}\n` +
      `📱 *Telefone:* ${this.formatPhoneNumber(request.clientPhone)}\n\n` +
      `📝 *Descrição:*\n${request.description}\n\n` +
      `📅 *Aceito em:* ${this.formatDate(request.createdAt)}\n` +
      `🔄 *Última atualização:* ${this.formatDate(request.updatedAt)}\n\n`;

    // Ações disponíveis baseadas no status
    if (request.status === 'ACCEPTED') {
      message += `💡 *Ações disponíveis:*\n`;
      message += `Digite *iniciar ${listPosition}* para marcar como "Em Andamento"\n`;
      message += `Digite *cancelar ${listPosition}* para cancelar este serviço\n\n`;
    } else if (request.status === 'IN_PROGRESS') {
      message += `💡 *Ações disponíveis:*\n`;
      message += `Digite *concluir ${listPosition}* para marcar como concluído\n\n`;
    }

    message += `Digite *${MenuOption.MENU}* para voltar ao menu.`;

    return message;
  }

  /**
   * Formata confirmação de aceitação
   */
  formatAcceptConfirmation(requestId: number, clientName: string, specialtyName: string): string {
    return (
      `✅ *Confirmar Aceitação*\n\n` +
      `Você deseja aceitar esta solicitação?\n\n` +
      `Cliente: *${clientName}*\n` +
      `Serviço: *${specialtyName}*\n\n` +
      `Ao aceitar, você se compromete a realizar este serviço.\n\n` +
      `Digite *confirmar* para aceitar a solicitação\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata confirmação de proposta (novo fluxo)
   */
  formatProposeConfirmation(requestId: number, clientName: string, specialtyName: string): string {
    return (
      `💼 *Confirmar Proposta*\n\n` +
      `Você deseja enviar uma proposta para esta solicitação?\n\n` +
      `Cliente: *${clientName}*\n` +
      `Serviço: *${specialtyName}*\n\n` +
      `Sua proposta será enviada ao cliente, que analisará seu perfil e decidirá.\n\n` +
      `Digite *confirmar* para enviar sua proposta\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata sucesso na aceitação
   */
  formatAcceptSuccess(clientName: string, clientPhone: string): string {
    return (
      `✅ *Solicitação Aceita com Sucesso!*\n\n` +
      `O cliente foi notificado que você aceitou o serviço.\n\n` +
      `📱 *Dados do Cliente:*\n` +
      `Nome: ${clientName}\n` +
      `Telefone: ${this.formatPhoneNumber(clientPhone)}\n\n` +
      `Entre em contato com o cliente para agendar o atendimento.\n\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata sucesso no envio de proposta (novo fluxo)
   */
  formatProposeSuccess(): string {
    return (
      `✅ *Proposta Enviada com Sucesso!*\n\n` +
      `Sua proposta foi enviada ao cliente.\n\n` +
      `O cliente analisará seu perfil e decidirá qual profissional escolher.\n\n` +
      `Você será notificado assim que o cliente tomar uma decisão.\n\n` +
      `💡 *Dica:* Profissionais com mais experiência e certificação têm maior chance de serem escolhidos.\n\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata confirmação de mudança de status
   */
  formatStatusChangeConfirmation(
    requestId: number,
    action: 'iniciar' | 'concluir' | 'cancelar',
    newStatus: string,
  ): string {
    const actionText = {
      iniciar: 'iniciar',
      concluir: 'concluir',
      cancelar: 'cancelar',
    };

    const statusText = {
      iniciar: 'Em Andamento',
      concluir: 'Concluído',
      cancelar: 'Cancelado',
    };

    return (
      `⚠️ *Confirmar Ação*\n\n` +
      `Você tem certeza que deseja ${actionText[action]} este serviço?\n\n` +
      `Novo status: *${statusText[action]}*\n\n` +
      `Digite *confirmar* para ${actionText[action]}\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata sucesso na mudança de status
   */
  formatStatusChangeSuccess(newStatus: string): string {
    const statusLabel = ServiceRequestStatusLabel[newStatus] || newStatus;
    
    return (
      `✅ *Status Atualizado!*\n\n` +
      `O serviço foi marcado como: *${statusLabel}*\n\n` +
      `O cliente foi notificado sobre esta atualização.\n\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata mensagem de erro quando profissional não tem especialidades
   */
  formatNoSpecialtiesError(): string {
    return (
      `⚠️ *Cadastre suas Especialidades*\n\n` +
      `Você precisa cadastrar pelo menos uma especialidade para visualizar solicitações.\n\n` +
      `Digite *1* no menu principal para cadastrar suas especialidades.\n\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata mensagem quando solicitação não está disponível
   */
  formatRequestNotAvailable(): string {
    return (
      `❌ *Solicitação Indisponível*\n\n` +
      `Esta solicitação não está mais disponível ou já foi aceita por outro profissional.\n\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
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

  /**
   * Calcula tempo decorrido desde uma data
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dia${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'agora mesmo';
  }

  /**
   * Formata número de telefone
   */
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  }
}
