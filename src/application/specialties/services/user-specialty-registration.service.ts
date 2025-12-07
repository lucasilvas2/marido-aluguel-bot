import { Injectable, Inject } from '@nestjs/common';
import { UserSpecialty } from 'src/domain/specialties/entities/user-specialty';
import { Specialty } from 'src/domain/specialties/entities/specialty';
import { UserSpecialtiesServiceInterface } from 'src/domain/specialties/services/user-specialties.service.interface';
import { SpecialtiesServiceInterface } from 'src/domain/specialties/services/specialties.service.interface';

@Injectable()
export class UserSpecialtyRegistrationService {
  constructor(
    @Inject(UserSpecialtiesServiceInterface)
    private readonly userSpecialtiesService: UserSpecialtiesServiceInterface,
    @Inject(SpecialtiesServiceInterface)
    private readonly specialtiesService: SpecialtiesServiceInterface,
  ) {}

  async registerUserSpecialty(
    userId: number,
    specialtyId: number,
    experienceYears?: number,
    pricePerHour?: number,
    notes?: string,
    isCertified?: boolean,
  ): Promise<UserSpecialty> {
    return await this.userSpecialtiesService.create(
      userId,
      specialtyId,
      experienceYears,
      pricePerHour,
      notes,
      isCertified,
    );
  }

  async listAvailableSpecialties(): Promise<Specialty[]> {
    return await this.specialtiesService.all();
  }

  async getUserSpecialties(userId: number): Promise<UserSpecialty[]> {
    return await this.userSpecialtiesService.findByUserId(userId);
  }
}
