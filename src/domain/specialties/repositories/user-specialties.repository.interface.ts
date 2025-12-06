export abstract class UserSpecialtiesRepositoryInterface {
    abstract create(
        userId: number, 
        specialtyId: number, 
        experienceYears?: number, 
        pricePerHour?: number,
        notes?: string,
        isCertified?: boolean
    ): Promise<void>;
    abstract delete(userId: number, specialtyId: number): Promise<void>;
    abstract findByUserIdAndSpecialtyId(userId: number, specialtyId: number): Promise<any | null>;
    abstract findByUserId(userId: number): Promise<any[]>;
    abstract findBySpecialtyId(specialtyId: number): Promise<any[]>;
    abstract findAll(): Promise<any[]>;
    abstract deleteByUserId(userId: number): Promise<void>;
    abstract removeSpecialtyFromUser(userId: number, specialtyId: number): Promise<void>;
    abstract getSpecialtiesByUserId(userId: number): Promise<any[]>;
}