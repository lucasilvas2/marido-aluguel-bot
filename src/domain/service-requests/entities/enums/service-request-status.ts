export enum ServiceRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const ServiceRequestStatusLabel = {
  [ServiceRequestStatus.PENDING]: 'Pendente',
  [ServiceRequestStatus.ACCEPTED]: 'Aceito',
  [ServiceRequestStatus.IN_PROGRESS]: 'Em Andamento',
  [ServiceRequestStatus.COMPLETED]: 'Concluído',
  [ServiceRequestStatus.CANCELLED]: 'Cancelado',
} as const;