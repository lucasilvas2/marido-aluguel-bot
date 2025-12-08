import { IBaseEvent } from '../interfaces/base-event.interface';

/**
 * Interface para listeners de eventos
 */
export interface IEventListener<T extends IBaseEvent = IBaseEvent> {
  /**
   * Processa o evento recebido
   * @param event Evento a ser processado
   */
  handle(event: T): Promise<void> | void;

  /**
   * Retorna os tipos de evento que este listener processa
   * @returns Array de tipos de evento ou '*' para todos
   */
  getEventTypes(): string[] | '*';

  /**
   * Nome do listener para logging
   */
  getListenerName(): string;
}
