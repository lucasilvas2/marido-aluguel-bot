import { Injectable } from '@nestjs/common';
import { IValidator } from './validator.interface';

/**
 * Validador de email
 * Verifica formato básico de email
 */
@Injectable()
export class EmailValidator implements IValidator<string> {
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  isValid(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const trimmedEmail = email.trim();
    
    if (trimmedEmail.length === 0 || trimmedEmail.length > 255) {
      return false;
    }

    return this.emailRegex.test(trimmedEmail);
  }

  getErrorMessage(): string {
    return '❌ Email inválido. Por favor, informe um email válido (ex: exemplo@email.com)';
  }

  sanitize(email: string): string {
    return email.trim().toLowerCase();
  }
}
