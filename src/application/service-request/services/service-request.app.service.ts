import { Injectable } from "@nestjs/common";
import { ServiceRequestAppServiceInterface } from "../interfaces/service-request.app.service.interfaces";
import { ServiceRequestsServiceInterface } from "src/domain/service-requests/services/service-requests.service.interface";
import { ServiceRequest } from "src/domain/service-requests/entities/service-request";

@Injectable()
export class ServiceRequestAppService implements ServiceRequestAppServiceInterface{

    constructor(
        protected readonly serviceRequestService: ServiceRequestsServiceInterface
    ) {}

    async create(clientId: number, professionalId: number | null, specialtyId: number, status: string, description: string): Promise<ServiceRequest> {
        return await this.serviceRequestService.create(clientId, professionalId, specialtyId, status, description);
    }

    async findById(id: number): Promise<ServiceRequest | null> {
        return await this.serviceRequestService.findById(id);
    }

    async update(id: number, clientId: number, professionalId: number | null, specialtyId: number, status: string, description: string): Promise<ServiceRequest> {
        return await this.serviceRequestService.update(id, clientId, professionalId, specialtyId, status, description);
    }

    async delete(id: number): Promise<void> {
        await this.serviceRequestService.delete(id);
    }

    async all(): Promise<ServiceRequest[]> {
        return await this.serviceRequestService.all();
    }

    async findByClientId(clientId: number): Promise<ServiceRequest[]> {
        return await this.serviceRequestService.findByClientId(clientId);
    }

    async findByProfessionalId(professionalId: number): Promise<ServiceRequest[]> {
        return await this.serviceRequestService.findByProfessionalId(professionalId);
    }

    async findByStatus(status: string): Promise<ServiceRequest[]> {
        return await this.serviceRequestService.findByStatus(status);
    }

    async findBySpecialtyId(specialtyId: number): Promise<ServiceRequest[]> {
        return await this.serviceRequestService.findBySpecialtyId(specialtyId);
    }
}