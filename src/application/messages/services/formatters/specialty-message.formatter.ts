import { Injectable } from '@nestjs/common';
import { AvailableSpecialtyDTO } from '../../dtos/available-specialty.dto';
import { MenuOption, ProfessionalMenuOption } from '../enums/menu-option.enum';

/**
 * Formatador de mensagens do fluxo de cadastro de especialidades
 */
@Injectable()
export class SpecialtyMessageFormatter {
  /**
   * Formata mensagem inicial de cadastro de especialidades
   */
  formatSpecialtyRegistrationStart(
    userName: string,
    specialties: AvailableSpecialtyDTO[]
  ): string {
    const specialtyList = specialties
      .map((s, idx) => `${idx + 1} - ${s.name}`)
      .join('\n');

    return (
      `🔧 *Cadastro de Especialidades*\n\n` +
      `Olá, ${userName}!\n\n` +
      `📋 Especialidades disponíveis:\n${specialtyList}\n\n` +
      `Digite os números das suas especialidades separados por vírgula (ex: 1,3,5)\n\n` +
      `Ou digite *${MenuOption.MENU}* para cancelar e voltar ao menu.`
    );
  }

  /**
   * Formata confirmação de especialidades selecionadas
   */
  formatSpecialtySelectionConfirmation(
    selectedNames: string[],
    currentIndex: number,
    currentName: string
  ): string {
    return (
      `✅ Especialidades selecionadas:\n${selectedNames.map((name, idx) => `${idx + 1}. ${name}`).join('\n')}\n\n` +
      `Agora vamos coletar informações sobre cada especialidade.\n\n` +
      `📝 Especialidade ${currentIndex + 1} de ${selectedNames.length}: ${currentName}\n\n` +
      `Quantos anos de experiência você tem? (Digite apenas o número ou "cancelar")`
    );
  }

  /**
   * Formata prompt para experiência
   */
  formatExperienceConfirmation(
    experienceYears: number,
    specialtyName: string
  ): string {
    return (
      `✅ ${experienceYears} anos de experiência registrados.\n\n` +
      `💰 Qual seu preço por hora para ${specialtyName}?\n` +
      `(Digite apenas o número, ex: 50.00, ou "cancelar")`
    );
  }

  /**
   * Formata prompt para certificação
   */
  formatPriceConfirmation(price: number): string {
    return (
      `✅ Preço de R$ ${price.toFixed(2)}/hora registrado.\n\n` +
      `🎓 Você possui certificação para esta especialidade?\n\n` +
      `Digite:\n1 - Sim\n2 - Não\n\n⚠️ Digite *0* ou *cancelar* para voltar ao menu.`
    );
  }

  /**
   * Formata prompt para observações
   */
  formatCertificationConfirmation(isCertified: boolean): string {
    return (
      `✅ Certificação: ${isCertified ? 'Sim' : 'Não'}\n\n` +
      `📝 Deseja adicionar observações sobre esta especialidade?\n\n` +
      `Digite suas observações ou "pular" para continuar.\n` +
      `Ou "cancelar" para voltar ao menu.`
    );
  }

  /**
   * Formata mensagem de próxima especialidade
   */
  formatNextSpecialtyPrompt(
    currentIndex: number,
    totalCount: number,
    nextSpecialtyName: string
  ): string {
    return (
      `✅ Especialidade registrada com sucesso!\n\n` +
      `📝 Especialidade ${currentIndex + 1} de ${totalCount}: ${nextSpecialtyName}\n\n` +
      `Quantos anos de experiência você tem? (Digite apenas o número ou "cancelar")`
    );
  }

  /**
   * Formata resumo final das especialidades cadastradas
   */
  formatSpecialtySummary(
    specialtiesData: Array<{
      name: string;
      experience: number;
      price: number;
      certified: boolean;
      notes?: string;
    }>
  ): string {
    const summary = specialtiesData
      .map(
        (s, idx) =>
          `${idx + 1}. ${s.name}\n` +
          `   Experiência: ${s.experience} anos\n` +
          `   Preço/hora: R$ ${s.price.toFixed(2)}\n` +
          `   Certificado: ${s.certified ? 'Sim' : 'Não'}` +
          (s.notes ? `\n   Obs: ${s.notes}` : '')
      )
      .join('\n\n');

    return (
      `🎉 Todas as especialidades foram cadastradas com sucesso!\n\n` +
      `📋 Resumo:\n\n${summary}\n\n` +
      `Você já pode receber solicitações de serviço!\n\n` +
      `Digite *${MenuOption.MENU}* ou *menu* para ver mais opções.`
    );
  }

  /**
   * Formata mensagem de cancelamento
   */
  formatCancellationMessage(): string {
    return `❌ Cadastro de especialidades cancelado.\n\nDigite *${MenuOption.MENU}* ou *menu* para ver as opções.`;
  }

  /**
   * Formata mensagem de erro no cadastro
   */
  formatRegistrationErrorMessage(): string {
    return '❌ Ocorreu um erro ao registrar a especialidade. Por favor, tente novamente mais tarde.';
  }

  /**
   * Formata lista de especialidades do usuário
   */
  formatUserSpecialtiesList(
    userName: string,
    specialties: Array<{
      name: string;
      experience: number;
      price: number;
      certified: boolean;
      notes?: string;
    }>
  ): string {
    if (specialties.length === 0) {
      return (
        `🔧 *MINHAS ESPECIALIDADES*\n\n` +
        `Você ainda não possui especialidades cadastradas.\n\n` +
        `Para começar a receber solicitações de serviço, cadastre suas especialidades!\n\n` +
        `Digite *${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES}* para cadastrar agora.`
      );
    }

    let message = `🔧 *MINHAS ESPECIALIDADES*\n\n`;
    message += `${userName}, você possui ${specialties.length} especialidade${specialties.length > 1 ? 's' : ''} cadastrada${specialties.length > 1 ? 's' : ''}:\n`;

    const avgPrice =
      specialties.reduce((sum, s) => sum + s.price, 0) / specialties.length;
    const totalExperience = specialties.reduce((sum, s) => sum + s.experience, 0);
    const certifiedCount = specialties.filter((s) => s.certified).length;

    specialties.forEach((s, idx) => {
      message += `\n━━━━━━━━━━━━━━━━━\n`;
      message += `*${idx + 1}. ${s.name}*\n`;
      message += `   💼 ${s.experience} ${s.experience === 1 ? 'ano' : 'anos'} de experiência\n`;
      message += `   💰 R$ ${s.price.toFixed(2)}/hora\n`;
      message += `   ${s.certified ? '✅ Certificado' : '⚪ Sem certificação'}\n`;

      if (s.notes && s.notes.trim()) {
        message += `   📝 ${s.notes}\n`;
      }
    });

    message += `\n━━━━━━━━━━━━━━━━━\n`;
    message += `\n📊 *Resumo do Perfil:*\n`;
    message += `• Experiência Total: ${totalExperience} anos\n`;
    message += `• Valor Médio: R$ ${avgPrice.toFixed(2)}/hora\n`;
    message += `• Certificações: ${certifiedCount}/${specialties.length}\n`;
    message += `\n💡 Digite *${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES}* para adicionar mais especialidades.`;
    message += `\nDigite *${MenuOption.MENU}* para voltar ao menu.`;

    return message;
  }
}
