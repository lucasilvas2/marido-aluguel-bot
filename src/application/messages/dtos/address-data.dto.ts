/**
 * DTO para dados de endereço
 */
export interface AddressDataDTO {
  /**
   * CEP (apenas números, 8 dígitos)
   */
  postalCode: string;

  /**
   * Nome da rua/avenida
   */
  street: string;

  /**
   * Número do imóvel
   */
  number: string;

  /**
   * Bairro
   */
  neighborhood: string;

  /**
   * Cidade
   */
  city: string;

  /**
   * Estado (sigla com 2 caracteres)
   */
  state: string;

  /**
   * Complemento (opcional)
   */
  complement?: string | null;

  /**
   * País (padrão: 'BR')
   */
  country?: string;
}
