/**
 * DTO para mensagens de conversa recebidas via WhatsApp
 */
export interface ConversationMessageDTO {
  /**
   * Número de telefone do remetente (sem @c.us)
   */
  phoneNumber: string;

  /**
   * Corpo da mensagem enviada pelo usuário
   */
  body: string;

  /**
   * Timestamp da mensagem (Unix timestamp em ms)
   */
  timestamp: number;

  /**
   * ID da mensagem (opcional, para rastreamento)
   */
  messageId?: string;

  /**
   * Indica se a mensagem foi enviada pelo próprio bot
   */
  fromMe?: boolean;
}
