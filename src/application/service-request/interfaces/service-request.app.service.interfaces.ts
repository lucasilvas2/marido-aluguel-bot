import { ServiceRequest } from 'src/domain/service-requests/entities/service-request';

export abstract class ServiceRequestAppServiceInterface {
    abstract create(clientId: number, professionalId: number | null, specialtyId: number, status: string, description: string): Promise<ServiceRequest>;
    abstract findById(id: number): Promise<ServiceRequest | null>;
    abstract update(id: number, clientId: number, professionalId: number | null, specialtyId: number, status: string, description: string): Promise<ServiceRequest>;
    abstract delete(id: number): Promise<void>;
    abstract all(): Promise<ServiceRequest[]>;
    abstract findByClientId(clientId: number): Promise<ServiceRequest[]>;
    abstract findByProfessionalId(professionalId: number): Promise<ServiceRequest[]>;
    abstract findByStatus(status: string): Promise<ServiceRequest[]>;
    abstract findBySpecialtyId(specialtyId: number): Promise<ServiceRequest[]>;
}