import { Injectable } from '@nestjs/common';
import { MenuOption } from '../enums/menu-option.enum';

/**
 * DTO para exibir proposta de profissional para o cliente
 */
export interface ProfessionalProposalDTO {
  proposalId: number;
  professionalId: number;
  professionalName: string;
  professionalPhone: string;
  specialtyName: string;
  experienceYears?: number;
  pricePerHour?: number;
  isCertified: boolean;
  completedServicesCount: number;
  proposedAt: Date;
}

/**
 * Formatador de mensagens para clientes visualizarem propostas
 */
@Injectable()
export class ClientProposalMessageFormatter {
  /**
   * Formata lista de propostas recebidas para um serviço
   */
  formatProposalsList(
    serviceRequestId: number,
    specialtyName: string,
    proposals: ProfessionalProposalDTO[],
  ): string {
    if (proposals.length === 0) {
      return (
        `📋 *Propostas para: ${specialtyName}*\n\n` +
        `Ainda não há propostas para este serviço.\n\n` +
        `Aguarde, os profissionais estão sendo notificados!\n\n` +
        `Digite *${MenuOption.MENU}* para voltar ao menu.`
      );
    }

    let message =
      `📋 *Propostas para: ${specialtyName}*\n\n` +
      `${proposals.length} profissional(is) se interessaram:\n\n`;

    proposals.forEach((proposal, index) => {
      const certifiedBadge = proposal.isCertified ? '✅' : '';
      message += `${index + 1}. 👤 *${proposal.professionalName}* ${certifiedBadge}\n`;
      message += `   📊 ${proposal.completedServicesCount} serviços concluídos\n`;
      
      if (proposal.experienceYears) {
        message += `   🎓 ${proposal.experienceYears} anos de experiência\n`;
      }
      
      if (proposal.pricePerHour) {
        message += `   💰 R$ ${proposal.pricePerHour.toFixed(2)}/hora\n`;
      }
      
      message += `   📅 Propôs há ${this.getTimeAgo(proposal.proposedAt)}\n\n`;
    });

    message += `💡 Digite o número para ver perfil completo\n`;
    message += `Digite *aprovar [número]* para selecionar\n`;
    message += `Digite *${MenuOption.MENU}* para voltar ao menu.`;

    return message;
  }

  /**
   * Formata perfil detalhado do profissional
   */
  formatProfessionalProfile(proposal: ProfessionalProposalDTO, listPosition: number): string {
    let message =
      `👤 *Perfil do Profissional*\n\n` +
      `Nome: *${proposal.professionalName}*\n`;

    if (proposal.isCertified) {
      message += `✅ *Certificado*\n`;
    }

    message += `\n📊 *Estatísticas:*\n`;
    message += `• ${proposal.completedServicesCount} serviços concluídos\n`;

    if (proposal.experienceYears) {
      message += `• ${proposal.experienceYears} anos de experiência\n`;
    }

    if (proposal.pricePerHour) {
      message += `\n💰 *Preço:*\n`;
      message += `R$ ${proposal.pricePerHour.toFixed(2)} por hora\n`;
    }

    message += `\n📱 *Contato:* ${this.formatPhoneNumber(proposal.professionalPhone)}\n`;
    message += `📅 *Propôs há:* ${this.getTimeAgo(proposal.proposedAt)}\n\n`;

    message += `💡 Digite *aprovar ${listPosition}* para escolher este profissional\n`;
    message += `Digite *voltar* para ver outras propostas\n`;
    message += `Digite *${MenuOption.MENU}* para voltar ao menu.`;

    return message;
  }

  /**
   * Formata confirmação de aprovação de proposta
   */
  formatApprovalConfirmation(
    professionalName: string,
    specialtyName: string,
  ): string {
    return (
      `✅ *Confirmar Seleção*\n\n` +
      `Você deseja selecionar este profissional?\n\n` +
      `Profissional: *${professionalName}*\n` +
      `Serviço: *${specialtyName}*\n\n` +
      `Ao confirmar, este profissional será notificado e receberá seus dados de contato.\n\n` +
      `Digite *confirmar* para selecionar\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata sucesso na seleção de profissional
   */
  formatApprovalSuccess(professionalName: string, professionalPhone: string): string {
    return (
      `🎉 *Profissional Selecionado!*\n\n` +
      `Você escolheu: *${professionalName}*\n\n` +
      `O profissional foi notificado e receberá seus dados de contato.\n\n` +
      `📱 *Contato do Profissional:*\n` +
      `Nome: ${professionalName}\n` +
      `Telefone: ${this.formatPhoneNumber(professionalPhone)}\n\n` +
      `O profissional entrará em contato em breve para agendar o serviço.\n\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata mensagem quando serviço não tem propostas
   */
  formatNoProposals(): string {
    return (
      `ℹ️ *Ainda sem propostas*\n\n` +
      `Este serviço ainda não recebeu propostas de profissionais.\n\n` +
      `Aguarde, os profissionais estão sendo notificados!\n\n` +
      `Digite *${MenuOption.MENU}* para voltar ao menu.`
    );
  }

  /**
   * Formata tempo decorrido desde uma data
   */
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  }

  /**
   * Formata número de telefone
   */
  private formatPhoneNumber(phone: string): string {
    // Remove caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Formato: (XX) XXXXX-XXXX
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    
    // Formato: (XX) XXXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  }
}
