import { Injectable } from '@nestjs/common';
import { IValidator } from './validator.interface';

/**
 * Validador de CEP (Código de Endereçamento Postal)
 * Valida formato brasileiro (8 dígitos)
 */
@Injectable()
export class PostalCodeValidator implements IValidator<string> {
  isValid(postalCode: string): boolean {
    if (!postalCode || typeof postalCode !== 'string') {
      return false;
    }

    // Remove caracteres não numéricos
    const cleanCode = postalCode.replace(/\D/g, '');
    
    // Verifica se tem exatamente 8 dígitos
    return cleanCode.length === 8;
  }

  getErrorMessage(): string {
    return '❌ CEP inválido. Por favor, informe um CEP válido com 8 dígitos (ex: 12345-678 ou 12345678)';
  }

  sanitize(postalCode: string): string {
    // Remove tudo que não é dígito
    return postalCode.replace(/\D/g, '');
  }
}
