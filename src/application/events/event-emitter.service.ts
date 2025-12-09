import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IBaseEvent } from './interfaces/base-event.interface';

/**
 * Serviço central para emissão e gerenciamento de eventos
 * Wrapper sobre EventEmitter2 do NestJS para type safety e logging
 */
@Injectable()
export class EventEmitterService {
  private readonly logger = new Logger(EventEmitterService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Emite um evento para todos os listeners registrados
   * @param event Evento a ser emitido
   */
  async emit(event: IBaseEvent): Promise<void> {
    try {
      this.logger.debug(
        `Emitting event: ${event.eventType} [${event.eventId}] for user ${event.userId || 'N/A'}`
      );

      // Emite o evento específico
      this.eventEmitter.emit(event.eventType, event);

      this.logger.verbose(`Event ${event.eventType} [${event.eventId}] emitted successfully`);
    } catch (error) {
      this.logger.error(
        `Error emitting event ${event.eventType} [${event.eventId}]:`,
        error.stack
      );
      // Não propaga erro para não quebrar o fluxo principal
    }
  }

  /**
   * Emite múltiplos eventos em sequência
   * @param events Array de eventos a serem emitidos
   */
  async emitMany(events: IBaseEvent[]): Promise<void> {
    for (const event of events) {
      await this.emit(event);
    }
  }

  /**
   * Emite um evento de forma síncrona (não aguarda listeners)
   * Útil quando não há necessidade de aguardar processamento
   * @param event Evento a ser emitido
   */
  emitSync(event: IBaseEvent): void {
    this.logger.debug(
      `Emitting event synchronously: ${event.eventType} [${event.eventId}]`
    );
    this.eventEmitter.emit(event.eventType, event);
    this.eventEmitter.emit('**', event);
  }
}
