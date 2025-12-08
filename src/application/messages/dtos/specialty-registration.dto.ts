/**
 * DTO para dados de uma especialidade a ser cadastrada
 */
export interface SpecialtyRegistrationDTO {
  /**
   * ID do usuário (profissional)
   */
  userId: number;

  /**
   * ID da especialidade
   */
  specialtyId: number;

  /**
   * Anos de experiência
   */
  experienceYears: number;

  /**
   * Preço por hora (em reais)
   */
  pricePerHour: number;

  /**
   * Observações/notas sobre a especialidade
   */
  notes?: string;

  /**
   * Indica se possui certificação
   */
  isCertified: boolean;
}
