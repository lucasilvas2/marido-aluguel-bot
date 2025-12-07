/**
 * DTO para dados coletados durante fluxo de cadastro de especialidades
 */
export interface SpecialtyFlowDataDTO {
  /**
   * ID do usuário
   */
  userId: number;

  /**
   * Nome do usuário
   */
  userName: string;

  /**
   * Especialidades disponíveis para seleção
   */
  availableSpecialties: Array<{ id: number; name: string }>;

  /**
   * IDs das especialidades selecionadas
   */
  selectedSpecialtyIds?: number[];

  /**
   * Nomes das especialidades selecionadas
   */
  selectedSpecialtyNames?: string[];

  /**
   * Índice da especialidade sendo processada atualmente
   */
  currentSpecialtyIndex?: number;

  /**
   * Anos de experiência (temporário para especialidade atual)
   */
  currentExperienceYears?: number;

  /**
   * Preço por hora (temporário para especialidade atual)
   */
  currentPricePerHour?: number;

  /**
   * Certificação (temporário para especialidade atual)
   */
  currentIsCertified?: boolean;

  /**
   * Dados das especialidades já cadastradas
   */
  specialtiesData?: Array<{
    name: string;
    experience: number;
    price: number;
    certified: boolean;
    notes?: string;
  }>;
}
