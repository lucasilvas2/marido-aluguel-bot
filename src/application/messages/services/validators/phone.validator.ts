import { Injectable } from '@nestjs/common';
import { IValidator } from './validator.interface';

/**
 * Validador de telefone brasileiro
 * Valida formato com DDD e número
 */
@Injectable()
export class PhoneValidator implements IValidator<string> {
  isValid(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Telefone brasileiro: 10 ou 11 dígitos (DDD + número)
    // 10 dígitos: fixo (XX) XXXX-XXXX
    // 11 dígitos: celular (XX) 9XXXX-XXXX
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  }

  getErrorMessage(): string {
    return '❌ Telefone inválido. Por favor, informe um telefone válido com DDD (ex: 11987654321)';
  }

  sanitize(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
