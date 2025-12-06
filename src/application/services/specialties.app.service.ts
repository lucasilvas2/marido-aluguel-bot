import { Injectable } from "@nestjs/common";
import { SpecialtiesAppServiceInterface } from "./interfaces/specialties.app.service.interface";
import { SpecialtiesServiceInterface } from "src/domain/specialties/services/specialties.service.interface";
import { Specialty } from "src/domain/specialties/entities/specialty";

@Injectable()
export class SpecialtiesAppService implements SpecialtiesAppServiceInterface  {

    constructor(private readonly specialtiesService: SpecialtiesServiceInterface) {}

    async create(name: string, description: string): Promise<Specialty> {
        return await this.specialtiesService.create(name, description);
    }

    async getById(id: number): Promise<Specialty | null> {
        return await this.specialtiesService.getById(id);
    }

    async update(id: number, name: string, description: string): Promise<void> {
        await this.specialtiesService.update(id, name, description);
    }

    async delete(id: number): Promise<void> {
        await this.specialtiesService.delete(id);
    }

    async all(): Promise<Specialty[]> {
        return await this.specialtiesService.all();
    }
    
}