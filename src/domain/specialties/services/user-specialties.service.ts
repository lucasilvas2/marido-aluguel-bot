import { Injectable } from "@nestjs/common";
import { UserSpecialty } from "../entities/user-specialty";
import { UserSpecialtiesRepositoryInterface } from "../repositories/user-specialties.repository.interface";
import { UserSpecialtiesServiceInterface } from "./user-specialties.service.interface";

@Injectable()
export class UserSpecialtiesService implements UserSpecialtiesServiceInterface {

    constructor(private readonly userSpecialtiesRepository: UserSpecialtiesRepositoryInterface) {}
    async addSpecialtyToUser(userId: number, specialtyId: number, experienceYears?: number, pricePerHour?: number, notes?: string, isCertified?: boolean): Promise<void> {
        await this.userSpecialtiesRepository.create(userId, specialtyId, experienceYears, pricePerHour, notes, isCertified);
    }

    async removeSpecialtyFromUser(userId: number, specialtyId: number): Promise<void> {
        await this.userSpecialtiesRepository.removeSpecialtyFromUser(userId, specialtyId);
    }

    async getSpecialtiesByUserId(userId: number): Promise<UserSpecialty[]> {
        const specialties = await this.userSpecialtiesRepository.getSpecialtiesByUserId(userId);
        return specialties;
    }

    async create(userId: number, specialtyId: number, experienceYears?: number, pricePerHour?: number, notes?: string, isCertified?: boolean): Promise<UserSpecialty> {
        await this.userSpecialtiesRepository.create(userId, specialtyId, experienceYears, pricePerHour, notes, isCertified);
        const userSpecialty = await this.userSpecialtiesRepository.findByUserIdAndSpecialtyId(userId, specialtyId);
        return userSpecialty;
    }

    async delete(userId: number, specialtyId: number): Promise<void> {
        await this.userSpecialtiesRepository.delete(userId, specialtyId);
    }

    async findByUserIdAndSpecialtyId(userId: number, specialtyId: number): Promise<UserSpecialty | null> {
        return await this.userSpecialtiesRepository.findByUserIdAndSpecialtyId(userId, specialtyId);
    }

    async findByUserId(userId: number): Promise<UserSpecialty[]> {
        return await this.userSpecialtiesRepository.findByUserId(userId);
    }

    async findBySpecialtyId(specialtyId: number): Promise<UserSpecialty[]> {
        return await this.userSpecialtiesRepository.findBySpecialtyId(specialtyId);
    }

    async findAll(): Promise<UserSpecialty[]> {
        return await this.userSpecialtiesRepository.findAll();
    }

    async deleteByUserId(userId: number): Promise<void> {
        await this.userSpecialtiesRepository.deleteByUserId(userId);
    }
    
}