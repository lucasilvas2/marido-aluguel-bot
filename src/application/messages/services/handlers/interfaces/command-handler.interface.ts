import { IConversationHandler } from './conversation-handler.interface';
import { User } from 'src/domain/users/entities/user';

/**
 * Interface para handlers de comandos únicos
 * Usado para ações que não requerem múltiplas etapas (menu, perfil, help)
 */
export interface ICommandHandler extends IConversationHandler {
  /**
   * Retorna os comandos que este handler pode processar
   * @returns Array de comandos (palavras-chave) que ativam este handler
   */
  getCommands(): string[];

  /**
   * Verifica se o comando pode ser executado pelo usuário
   * @param user Usuário que solicitou o comando
   * @param command Comando solicitado
   * @returns true se usuário tem permissão, false caso contrário
   */
  canExecute(user: User | null, command: string): boolean | Promise<boolean>;

  /**
   * Executa o comando e retorna resposta
   * @param command Comando a executar
   * @param user Usuário que solicitou
   * @param args Argumentos adicionais do comando
   * @returns Mensagem de resposta a ser enviada
   */
  execute(
    command: string,
    user: User | null,
    args?: Record<string, any>
  ): Promise<string>;
}
