import { User } from 'src/domain/users/entities/user';
import { ConversationMessageDTO } from '../../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../../dtos/conversation-state.dto';

/**
 * Interface base para handlers conversacionais
 * Implementa Strategy Pattern para delegação de lógica específica
 */
export interface IConversationHandler {
  /**
   * Determina se este handler pode processar a mensagem atual
   * @param state Estado atual da conversa
   * @param user Usuário que enviou a mensagem (pode ser null se não cadastrado)
   * @param messageBody Corpo da mensagem
   * @returns true se pode processar, false caso contrário
   */
  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string
  ): boolean | Promise<boolean>;

  /**
   * Processa a mensagem e retorna o próximo estado da conversa
   * @param message Mensagem recebida do usuário
   * @param state Estado atual da conversa
   * @param user Usuário que enviou a mensagem (pode ser null)
   * @returns Próximo estado da conversa ou null se conversa finalizada
   */
  handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null
  ): Promise<ConversationStateDTO | null>;

  /**
   * Retorna o nome do handler para logging e debugging
   */
  getHandlerName(): string;
}
