/**
 * Interface para validadores
 */
export interface IValidator<T = string> {
  /**
   * Valida o valor de entrada
   * @param value Valor a ser validado
   * @returns true se válido, false caso contrário
   */
  isValid(value: T): boolean;

  /**
   * Retorna mensagem de erro descritiva
   * @returns Mensagem de erro
   */
  getErrorMessage(): string;

  /**
   * Sanitiza/normaliza o valor de entrada
   * @param value Valor a ser sanitizado
   * @returns Valor sanitizado
   */
  sanitize?(value: T): T;
}
