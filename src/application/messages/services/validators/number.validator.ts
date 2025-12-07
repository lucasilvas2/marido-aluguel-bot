import { IValidator } from './validator.interface';

/**
 * Validador de números (genérico)
 * Valida valores numéricos com opções de range
 * 
 * NÃO é um provider do NestJS - use métodos factory estáticos
 */
export class NumberValidator implements IValidator<string | number> {
  constructor(
    private readonly min?: number,
    private readonly max?: number,
    private readonly allowDecimals: boolean = true
  ) {}

  /**
   * Cria validador para inteiros em um range
   */
  static forIntegerRange(min: number, max: number): NumberValidator {
    return new NumberValidator(min, max, false);
  }

  /**
   * Cria validador para decimais em um range
   */
  static forDecimalRange(min: number, max?: number): NumberValidator {
    return new NumberValidator(min, max, true);
  }

  /**
   * Cria validador para números positivos
   */
  static forPositive(allowDecimals: boolean = true): NumberValidator {
    return new NumberValidator(0.01, undefined, allowDecimals);
  }

  isValid(value: string | number): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(',', '.'))
      : value;

    if (isNaN(numValue)) {
      return false;
    }

    if (!this.allowDecimals && !Number.isInteger(numValue)) {
      return false;
    }

    if (this.min !== undefined && numValue < this.min) {
      return false;
    }

    if (this.max !== undefined && numValue > this.max) {
      return false;
    }

    return true;
  }

  getErrorMessage(): string {
    let message = '❌ Valor inválido. ';
    
    if (this.min !== undefined && this.max !== undefined) {
      message += `Digite um número entre ${this.min} e ${this.max}`;
    } else if (this.min !== undefined) {
      message += `Digite um número maior ou igual a ${this.min}`;
    } else if (this.max !== undefined) {
      message += `Digite um número menor ou igual a ${this.max}`;
    } else {
      message += 'Digite um número válido';
    }

    if (!this.allowDecimals) {
      message += ' (apenas números inteiros)';
    }

    return message;
  }

  sanitize(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    return parseFloat(value.replace(',', '.'));
  }
}
