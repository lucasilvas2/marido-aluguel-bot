import { Injectable } from '@nestjs/common';
import { User } from 'src/domain/users/entities/user';
import { UserType, UserTypeLabel } from 'src/domain/users/entities/enums/user-type.enum';
import {
  MenuOption,
  ProfessionalMenuOption,
  ClientMenuOption,
  UnregisteredMenuOption,
  UserRegistrationOption,
} from '../enums/menu-option.enum';

/**
 * Formatador de mensagens de menu e boas-vindas
 * Centraliza toda formatação de mensagens do sistema
 */
@Injectable()
export class MenuMessageFormatter {
  /**
   * Formata mensagem de boas-vindas para novos usuários
   */
  formatWelcomeMessage(): string {
    return (
      '👋 Olá! Bem-vindo ao Marido de Aluguel!\n\n' +
      'Sou seu assistente virtual e vou te ajudar.\n\n' +
      'Para começar, me diga:\n' +
      `${UserRegistrationOption.CLIENTE}️⃣ - Quero me cadastrar como CLIENTE\n` +
      `${UserRegistrationOption.PROFISSIONAL}️⃣ - Quero me cadastrar como PROFISSIONAL\n\n` +
      'Digite o número da opção desejada.'
    );
  }

  /**
   * Formata mensagem de boas-vindas de retorno para usuários cadastrados
   */
  formatWelcomeBackMessage(userName: string): string {
    return (
      `👋 Olá novamente, ${userName}!\n\n` +
      'É bom te ver por aqui! 😊\n\n' +
      'Como posso te ajudar hoje?\n\n' +
      `Digite *${MenuOption.MENU}* ou *menu* para ver as opções disponíveis.`
    );
  }

  /**
   * Formata menu principal baseado no tipo de usuário
   */
  formatMainMenu(user: User | null): string {
    let helpText = '📋 *MENU PRINCIPAL*\n\n';

    if (user) {
      helpText += `Olá, ${user.getName()}! 👋\n\n`;
      helpText += 'Escolha uma opção:\n\n';

      if (user.getUserType() === UserType.PROFESSIONAL) {
        helpText += this.formatProfessionalMenu();
      } else {
        helpText += this.formatClientMenu();
      }
    } else {
      helpText += this.formatUnregisteredMenu();
    }

    helpText += '\n💡 Digite apenas o número da opção desejada.';
    return helpText;
  }

  /**
   * Formata menu para profissionais
   */
  private formatProfessionalMenu(): string {
    return (
      `${ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES} - 🔧 Cadastrar Especialidades\n` +
      `${ProfessionalMenuOption.VER_SOLICITACOES} - 📋 Ver Solicitações\n` +
      `${ProfessionalMenuOption.VER_PERFIL} - 👤 Meu Perfil\n` +
      `${MenuOption.MENU} - ❓ Menu de Ajuda`
    );
  }

  /**
   * Formata menu para clientes
   */
  private formatClientMenu(): string {
    return (
      `${ClientMenuOption.SOLICITAR_SERVICO} - 🛠️ Solicitar Serviço\n` +
      `${ClientMenuOption.MEUS_PEDIDOS} - 📦 Meus Pedidos\n` +
      `${ClientMenuOption.VER_PERFIL} - 👤 Meu Perfil\n` +
      `${MenuOption.MENU} - ❓ Menu de Ajuda`
    );
  }

  /**
   * Formata menu para usuários não cadastrados
   */
  private formatUnregisteredMenu(): string {
    return (
      '👋 Olá! Vejo que você ainda não tem cadastro.\n\n' +
      'Para começar a usar nossos serviços, digite:\n\n' +
      `${UnregisteredMenuOption.FAZER_CADASTRO}️⃣ - Fazer cadastro\n` +
      `${MenuOption.MENU}️⃣ - Ver menu de ajuda`
    );
  }

  /**
   * Formata mensagem de opção inválida
   */
  formatInvalidOptionMessage(): string {
    return `Desculpe, não entendi. Digite *${MenuOption.MENU}* ou *menu* para ver as opções disponíveis.`;
  }

  /**
   * Formata mensagem de funcionalidade em desenvolvimento
   */
  formatFeatureInDevelopmentMessage(): string {
    return '🚧 Funcionalidade em desenvolvimento...';
  }
}
