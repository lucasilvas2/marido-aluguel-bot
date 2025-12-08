export interface ServiceRequestRegistrationDto {
    clientId: number;
    professionalId?: number;
    specialtyId: number;
    status: string;
    description?: string;

    serviceRquestData?: Array<{
        id: number;
        clientId: number;
        professionalId: number | null;
        specialtyId: number;
        status: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes?: string;
        requestedDate?: Date;
        completedDate?: Date;
    }>;
}