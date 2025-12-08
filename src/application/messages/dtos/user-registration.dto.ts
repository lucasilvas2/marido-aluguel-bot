/**
 * DTO para dados de cadastro de usuário
 */
export interface UserRegistrationDTO {
  /**
   * Nome completo do usuário
   */
  name: string;

  /**
   * Email do usuário
   */
  email: string;

  /**
   * Telefone (sem máscara, apenas números)
   */
  phone: string;

  /**
   * Tipo de usuário: 'CLIENT' | 'PROFESSIONAL'
   */
  userType: string;
}
