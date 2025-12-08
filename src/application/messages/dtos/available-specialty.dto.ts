/**
 * DTO simplificado para especialidades disponíveis
 */
export interface AvailableSpecialtyDTO {
  /**
   * ID da especialidade
   */
  id: number;

  /**
   * Nome da especialidade
   */
  name: string;

  /**
   * Descrição (opcional)
   */
  description?: string;
}
