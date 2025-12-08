import { v4 as uuidv4 } from 'uuid';

/**
 * Interface base para todos os eventos do sistema
 * Segue padrão Event-Driven Architecture
 */
export interface IBaseEvent {
  /**
   * ID único do evento (UUID)
   */
  eventId: string;

  /**
   * Tipo do evento (ex: 'user.registered', 'specialty.added')
   */
  eventType: string;

  /**
   * Timestamp de quando o evento foi criado
   */
  timestamp: Date;

  /**
   * ID do usuário relacionado ao evento (se aplicável)
   */
  userId?: number;

  /**
   * Número de telefone do usuário (se aplicável)
   */
  phoneNumber?: string;

  /**
   * Metadados adicionais do evento
   */
  metadata?: Record<string, any>;
}

/**
 * Classe base abstrata para eventos
 * Fornece implementação padrão de propriedades comuns
 */
export abstract class BaseEvent implements IBaseEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;
  public abstract readonly eventType: string;

  constructor(
    public readonly userId?: number,
    public readonly phoneNumber?: string,
    public readonly metadata?: Record<string, any>
  ) {
    this.eventId = uuidv4();
    this.timestamp = new Date();
  }
}
