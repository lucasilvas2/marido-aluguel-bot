import { UserSpecialty } from '../entities/user-specialty';

export abstract class UserSpecialtiesServiceInterface {
    abstract create(
        userId: number, 
        specialtyId: number,
        experienceYears?: number, 
        pricePerHour?: number,
        notes?: string,
        isCertified?: boolean
    ): Promise<UserSpecialty>;
    abstract delete(userId: number, specialtyId: number): Promise<void>;
    abstract findByUserIdAndSpecialtyId(userId: number, specialtyId: number): Promise<UserSpecialty | null>;
    abstract findByUserId(userId: number): Promise<UserSpecialty[]>;
    abstract findBySpecialtyId(specialtyId: number): Promise<UserSpecialty[]>;
    abstract findAll(): Promise<UserSpecialty[]>;
    abstract deleteByUserId(userId: number): Promise<void>;
    abstract removeSpecialtyFromUser(userId: number, specialtyId: number): Promise<void>;
    abstract getSpecialtiesByUserId(userId: number): Promise<UserSpecialty[]>;
}