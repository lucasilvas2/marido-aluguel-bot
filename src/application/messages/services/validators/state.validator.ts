import { Injectable } from '@nestjs/common';
import { IValidator } from './validator.interface';

/**
 * Validador de estado brasileiro (UF)
 * Valida siglas de estados válidos
 */
@Injectable()
export class StateValidator implements IValidator<string> {
  private readonly validStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  isValid(state: string): boolean {
    if (!state || typeof state !== 'string') {
      return false;
    }

    const normalizedState = state.trim().toUpperCase();
    return this.validStates.includes(normalizedState);
  }

  getErrorMessage(): string {
    return '❌ Estado inválido. Por favor, informe a sigla do estado (ex: SP, RJ, MG)';
  }

  sanitize(state: string): string {
    return state.trim().toUpperCase();
  }

  /**
   * Retorna lista de estados válidos
   */
  getValidStates(): string[] {
    return [...this.validStates];
  }
}
