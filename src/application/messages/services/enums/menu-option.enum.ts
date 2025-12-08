export enum MenuOption {
  MENU = '0',
  OPTION_ONE = '1',
  OPTION_TWO = '2',
  OPTION_THREE = '3',
}

export enum ProfessionalMenuOption {
  MENU = MenuOption.MENU,
  CADASTRAR_ESPECIALIDADES = MenuOption.OPTION_ONE,
  VER_SOLICITACOES = MenuOption.OPTION_TWO,
  VER_PERFIL = MenuOption.OPTION_THREE,
}

export enum ClientMenuOption {
  MENU = MenuOption.MENU,
  SOLICITAR_SERVICO = MenuOption.OPTION_ONE,
  MEUS_PEDIDOS = MenuOption.OPTION_TWO,
  VER_PERFIL = MenuOption.OPTION_THREE,
}

export enum UnregisteredMenuOption {
  MENU = MenuOption.MENU,
  FAZER_CADASTRO = MenuOption.OPTION_ONE,
}

export enum UserRegistrationOption {
  CLIENTE = '1',
  PROFISSIONAL = '2',
}
