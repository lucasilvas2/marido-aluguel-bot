import { IConversationHandler } from './conversation-handler.interface';
import { ConversationMessageDTO } from '../../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../../dtos/conversation-state.dto';

/**
 * Interface para handlers de fluxos multi-etapa
 * Usado para processos que requerem múltiplas interações (cadastro, formulários)
 */
export interface IConversationFlowHandler extends IConversationHandler {
  /**
   * Retorna os estados que este handler pode processar
   * @returns Array de nomes de estados que este handler gerencia
   */
  getHandledStates(): string[];

  /**
   * Valida a entrada do usuário para o estado atual
   * @param input Entrada do usuário
   * @param currentState Estado atual da conversa
   * @returns Objeto com isValid e mensagem de erro (se houver)
   */
  validateInput(
    input: string,
    currentState: ConversationStateDTO
  ): Promise<{ isValid: boolean; errorMessage?: string }>;

  /**
   * Processa um passo específico do fluxo
   * @param message Mensagem recebida
   * @param state Estado atual
   * @returns Próximo estado ou null se fluxo finalizado
   */
  processStep(
    message: ConversationMessageDTO,
    state: ConversationStateDTO
  ): Promise<ConversationStateDTO | null>;
}
