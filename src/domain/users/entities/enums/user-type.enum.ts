export enum UserType {
  CLIENT = 1,
  PROFESSIONAL = 2,
}

export const UserTypeLabel = {
  [UserType.CLIENT]: 'Cliente',
  [UserType.PROFESSIONAL]: 'Profissional',
} as const;

export const UserTypeString = {
  CLIENT: 'CLIENT',
  PROFESSIONAL: 'PROFESSIONAL',
} as const;
