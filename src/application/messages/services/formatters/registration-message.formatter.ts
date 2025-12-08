import { Injectable } from '@nestjs/common';
import { UserRegistrationDTO } from '../../dtos/user-registration.dto';
import { UserType, UserTypeLabel, UserTypeString } from 'src/domain/users/entities/enums/user-type.enum';
import { MenuOption } from '../enums/menu-option.enum';

/**
 * Formatador de mensagens do fluxo de cadastro de usuário
 */
@Injectable()
export class RegistrationMessageFormatter {
  /**
   * Formata mensagem de sucesso do cadastro
   */
  formatRegistrationSuccessMessage(userData: UserRegistrationDTO): string {
    const userTypeLabel =
      userData.userType === UserTypeString.CLIENT
        ? UserTypeLabel[UserType.CLIENT]
        : UserTypeLabel[UserType.PROFESSIONAL];

    return (
      `✅ Cadastro realizado com sucesso!\n\n` +
      `📋 Seus dados:\n` +
      `Nome: ${userData.name}\n` +
      `Email: ${userData.email}\n` +
      `Telefone: ${userData.phone}\n` +
      `Tipo: ${userTypeLabel}\n\n` +
      `Você já pode usar nossos serviços! Digite *${MenuOption.MENU}* ou *menu* para ver as opções.`
    );
  }

  /**
   * Formata mensagem de erro de usuário duplicado
   */
  formatDuplicateUserMessage(): string {
    return '❌ Já existe um cadastro com este telefone. Se for você, digite "menu" para ver opções ou entre em contato com o suporte.';
  }

  /**
   * Formata mensagem de erro genérico de cadastro
   */
  formatRegistrationErrorMessage(): string {
    return '❌ Ocorreu um erro ao realizar seu cadastro. Por favor, tente novamente mais tarde.';
  }

  /**
   * Formata prompt para seleção de tipo de usuário
   */
  formatUserTypePrompt(): string {
    return '✅ Ótimo! Vou te ajudar a se cadastrar.\n\nVocê é cliente ou profissional?';
  }

  /**
   * Formata prompt para nome
   */
  formatNamePrompt(isClient: boolean): string {
    const userType = isClient ? 'cliente' : 'profissional';
    return `✅ Ótimo! Vou te ajudar a se cadastrar como ${userType}.\n\nPor favor, me informe seu nome completo:`;
  }

  /**
   * Formata prompt para email
   */
  formatEmailPrompt(name: string): string {
    return `Prazer, ${name}! 😊\n\nAgora, me informe seu email:`;
  }

  /**
   * Formata prompt para CEP
   */
  formatPostalCodePrompt(): string {
    return 'Perfeito! 📧\n\nAgora preciso do seu endereço.\nPor favor, me informe o CEP:';
  }

  /**
   * Formata prompt para rua
   */
  formatStreetPrompt(): string {
    return 'Ótimo! 📍\n\nAgora me informe a rua:';
  }

  /**
   * Formata prompt para número
   */
  formatNumberPrompt(): string {
    return 'Perfeito! Agora me informe o número:';
  }

  /**
   * Formata prompt para bairro
   */
  formatNeighborhoodPrompt(): string {
    return 'Ok! Me informe o bairro:';
  }

  /**
   * Formata prompt para cidade
   */
  formatCityPrompt(): string {
    return 'Ótimo! Agora a cidade:';
  }

  /**
   * Formata prompt para estado
   */
  formatStatePrompt(): string {
    return 'Quase lá! Por fim, me informe o estado (UF):';
  }
}
