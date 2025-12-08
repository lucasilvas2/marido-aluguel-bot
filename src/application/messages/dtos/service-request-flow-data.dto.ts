/**
 * DTO para dados coletados durante fluxo de solicitação de serviço
 */
export interface ServiceRequestFlowDataDTO {
  /**
   * ID da especialidade selecionada
   */
  specialtyId?: number;

  /**
   * Nome da especialidade (para exibição)
   */
  specialtyName?: string;

  /**
   * Descrição detalhada do problema/serviço solicitado
   */
  description?: string;
}
