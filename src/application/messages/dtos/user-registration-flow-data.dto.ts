/**
 * DTO para dados coletados durante fluxo de cadastro de usuário
 */
export interface UserRegistrationFlowDataDTO {
  /**
   * Tipo de usuário sendo cadastrado
   */
  userType?: string;

  /**
   * Nome coletado
   */
  name?: string;

  /**
   * Email coletado
   */
  email?: string;

  /**
   * Dados do endereço sendo coletados
   */
  address?: {
    postalCode?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    complement?: string;
  };
}
