import { Injectable } from "@nestjs/common";
import { ServiceRequestAppServiceInterface } from "../interfaces/service-request.app.service.interfaces";

@Injectable()
export class ServiceRequestAppService implements ServiceRequestAppServiceInterface{

    constructor(
        protected readonly serviceRequest: ServiceRequestAppServiceInterface
    ) {}

    async create(clientId: number, professionalId: number, specialtyId: number, status: string, description: string): Promise<void> {
        return this.serviceRequest.create(clientId, professionalId, specialtyId, status, description);
    }

    async findById(id: number): Promise<any> {
        return this.serviceRequest.findById(id);
    }

    async update(id: number, status: string, description: string): Promise<void> {
        return this.serviceRequest.update(id, status, description);
    }

    async delete(id: number): Promise<void> {
        return this.serviceRequest.delete(id);
    }

    async all(): Promise<any[]> {
        return this.serviceRequest.all();
    }

    async findByClientId(clientId: number): Promise<any[]> {
        return this.serviceRequest.findByClientId(clientId);
    }

    async findByProfessionalId(professionalId: number): Promise<any[]> {
        return this.serviceRequest.findByProfessionalId(professionalId);
    }

    async findByStatus(status: string): Promise<any[]> {
        return this.serviceRequest.findByStatus(status);
    }

    async findBySpecialtyId(specialtyId: number): Promise<any[]> {
        return this.serviceRequest.findBySpecialtyId(specialtyId);
    }
}