export abstract class ServiceRequestAppServiceInterface {
    abstract create(clientId: number, professionalId: number, specialtyId: number, status: string, description: string): Promise<void>;
    abstract findById(id: number): Promise<any>;
    abstract update(id: number, status: string, description: string): Promise<void>;
    abstract delete(id: number): Promise<void>;
    abstract all(): Promise<any[]>;
    abstract findByClientId(clientId: number): Promise<any[]>;
    abstract findByProfessionalId(professionalId: number): Promise<any[]>;
    abstract findByStatus(status: string): Promise<any[]>;
    abstract findBySpecialtyId(specialtyId: number): Promise<any[]>;
}