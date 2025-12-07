import { Injectable } from '@nestjs/common';
import { UserSpecialty } from 'src/domain/specialties/entities/user-specialty';
import { UserSpecialtiesServiceInterface } from "src/domain/specialties/services/user-specialties.service.interface";@Injectable()   

export class UserSpecialtyRegistrationService {
    constructor(
        private readonly userSpecialtiesService: UserSpecialtiesServiceInterface,
    ) {}


    async registerUserSpecialty(
        userId: number, 
        specialtyId: number, 
        experienceYears: number,
        pricePerHour: number,
        notes: string,
        isCertified: boolean
    ): Promise<UserSpecialty> {
        const userSpecialty = await this.userSpecialtiesService.create(
            userId, 
            specialtyId, 
            experienceYears, 
            pricePerHour,
            notes, 
            isCertified
        );

        return userSpecialty;
    }
}