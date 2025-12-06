import { Injectable } from '@nestjs/common';
import { SpecialtiesRepositoryInterface } from '../repositories/specialties.repository.interface';
import { SpecialtiesServiceInterface } from './specialties.service.interface';
import { Specialty } from '../entities/specialty';

@Injectable()
export class SpecialtiesService implements SpecialtiesServiceInterface {

    constructor(private readonly specialtiesRepository: SpecialtiesRepositoryInterface) {}

    async create(name: string, description: string): Promise<Specialty> {
        return await this.specialtiesRepository.create(name, description);
    }

    async getById(id: number): Promise<Specialty | null> {
        return await this.specialtiesRepository.getById(id);
    }

    async update(id: number, name: string, description: string): Promise<void> {
        await this.specialtiesRepository.update(id, name, description);
    }

    async delete(id: number): Promise<void> {
        await this.specialtiesRepository.delete(id);
    }

    async all(): Promise<Specialty[]> {
        return await this.specialtiesRepository.all();
    }  
}