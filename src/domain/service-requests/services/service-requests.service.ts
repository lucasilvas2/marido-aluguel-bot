import { Injectable } from "@nestjs/common";
import { ServiceRequestsServiceInterface } from "./service-requests.service.interface";
import { ServiceRequestsRepositoryInterface } from "../repositories/service-requests.repository.interface";
import { ServiceRequest } from "../entities/service-request";

@Injectable()
export class ServiceRequestsService implements ServiceRequestsServiceInterface {
    constructor(protected readonly serviceRequestRepository: ServiceRequestsRepositoryInterface) {}

    async create(clientId: number, professionalId: number, specialtyId: number, status: string, description: string): Promise<ServiceRequest> {
        return await this.serviceRequestRepository.create(clientId, professionalId, specialtyId, status, description);
    }


    async findById(id: number): Promise<ServiceRequest | null> {
        return await this.serviceRequestRepository.findById(id);
    }

    async update(id: number, clientId: number, professionalId: number, specialtyId: number, status: string, description: string): Promise<ServiceRequest> {
        return await this.serviceRequestRepository.update(id, clientId, professionalId, specialtyId, status, description);
    }

    async delete(id: number): Promise<void> {
        await this.serviceRequestRepository.delete(id);
    }

    async findByClientId(clientId: number): Promise<ServiceRequest[]> {
        return await this.serviceRequestRepository.findByClientId(clientId);
    }

    async findByProfessionalId(professionalId: number): Promise<ServiceRequest[]> {
        return await this.serviceRequestRepository.findByProfessionalId(professionalId);
    }

    async findByStatus(status: string): Promise<ServiceRequest[]> {
        return await this.serviceRequestRepository.findByStatus(status);
    }

    async all(): Promise<ServiceRequest[]> {
        return await this.serviceRequestRepository.all();
    }

    async findBySpecialtyId(specialtyId: number): Promise<ServiceRequest[]> {
        return await this.serviceRequestRepository.findBySpecialtyId(specialtyId);
    }
}