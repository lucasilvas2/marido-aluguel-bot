/**
 * DTO para estado da conversa
 * Armazena progresso e dados temporários durante interações multi-etapa
 */
export interface ConversationStateDTO {
  /**
   * Identificador do usuário (telefone)
   */
  userId: string;

  /**
   * Estado atual da conversa
   * @example 'idle', 'waiting_user_info', 'waiting_address', 'waiting_specialty_selection'
   */
  state: string;

  /**
   * Dados coletados durante a conversa
   */
  data?: Record<string, any>;

  /**
   * Timestamp da última atualização
   */
  lastUpdated?: Date;

  /**
   * Contador de tentativas/erros (para limitar tentativas inválidas)
   */
  attemptCount?: number;
}
