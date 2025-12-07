import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/users/entities/user';
import { UserSpecialty } from 'src/domain/specialties/entities/user-specialty';
import { UserType, UserTypeLabel } from 'src/domain/users/entities/enums/user-type.enum';
import { ProfessionalMenuOption, ClientMenuOption, MenuOption } from '../enums/menu-option.enum';

/**
 * Formatador de mensagens de perfil de usuário
 */
@Injectable()
export class ProfileMessageFormatter {
  /**
   * Formata perfil completo do usuário
   */
  formatUserProfile(
    user: User,
    phoneNumber: string,
    specialties?: UserSpecialty[]
  ): string {
    const userTypeLabel = UserTypeLabel[user.getUserType() as UserType];

    let profileText =
      `👤 *MEU PERFIL*\n\n` +
      `📝 Nome: ${user.getName()}\n` +
      `📱 Telefone: ${phoneNumber}\n` +
      `👔 Tipo: ${userTypeLabel}\n`;

    if (user.getUserType() === UserType.PROFESSIONAL) {
      profileText += this.formatProfessionalSection(specialties);
    } else {
      profileText += this.formatClientSection();
    }

    profileText += `\n\n━━━━━━━━━━━━━━━━━\n`;
    profileText += `Digite *${MenuOption.MENU}* ou *menu* para voltar ao menu principal.`;

    return profileText;
  }

  /**
   * Formata seção de especialidades do profissional
   */
  private formatProfessionalSection(specialties?: UserSpecialty[]): string {
    let section = '\n━━━━━━━━━━━━━━━━━\n';

    if (specialties && specialties.length > 0) {
      section += `\n🔧 *Especialidades Cadastradas* (${specialties.length}):\n`;

      specialties.forEach((us, idx) => {
        const specialtyName = us.getSpecialty()?.getName() || 'N/A';
        const experience = us.getExperienceYears() ?? 0;
        const price = us.getPricePerHour() ?? 0;
        const certified = us.getIsCertified() ? '✅ Certificado' : '⚪ Sem certificação';
        const notes = us.getNotes();

        section += `\n${idx + 1}. *${specialtyName}*\n`;
        section += `   💼 ${experience} ${experience === 1 ? 'ano' : 'anos'} de experiência\n`;
        section += `   💰 R$ ${price.toFixed(2)}/hora\n`;
        section += `   ${certified}\n`;

        if (notes && notes.trim()) {
          section += `   📝 ${notes}\n`;
        }
      });

      section += `\n━━━━━━━━━━━━━━━━━\n`;
      section += `\n💡 *Dica:* Digite *${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES}* para adicionar mais especialidades!`;
    } else {
      section += `⚠️ *Você ainda não cadastrou especialidades.*\n\n`;
      section += `As especialidades são essenciais para que clientes possam te encontrar e contratar!\n\n`;
      section += `📌 Digite *${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES}* para cadastrar agora!`;
    }

    return section;
  }

  /**
   * Formata seção de informações do cliente
   */
  private formatClientSection(): string {
    return (
      '\n━━━━━━━━━━━━━━━━━\n' +
      '\n💡 *Como cliente, você pode:*\n' +
      '• Solicitar serviços de profissionais\n' +
      '• Acompanhar seus pedidos\n' +
      '• Avaliar profissionais\n\n' +
      `Digite *${ClientMenuOption.SOLICITAR_SERVICO}* para solicitar um serviço!`
    );
  }

  /**
   * Formata mensagem de erro ao carregar perfil
   */
  formatProfileErrorMessage(): string {
    return (
      '\n━━━━━━━━━━━━━━━━━\n' +
      '\n⚠️ Não foi possível carregar suas especialidades no momento.\n' +
      'Por favor, tente novamente mais tarde.'
    );
  }
}
