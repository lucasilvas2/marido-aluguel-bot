import { User } from "@prisma/client";
import { Specialty } from "./specialty";

export class UserSpecialty {
    protected userId: number;
    protected specialtyId: number;
    protected user: User;
    protected specialty: Specialty;
    protected experienceYears?: number;
    protected pricePerHour?: number;
    protected notes?: string;
    protected isCertified: boolean;
    protected createdAt: Date;
    protected updatedAt: Date;

    constructor(
        userId: number,
        specialtyId: number,
        user: User,
        specialty: Specialty,
        isCertified: boolean,
        createdAt: Date,
        updatedAt: Date,
        experienceYears?: number,
        pricePerHour?: number,
        notes?: string
    ) {
        this.setUserId(userId);
        this.setSpecialtyId(specialtyId);
        this.setUser(user);
        this.setSpecialty(specialty);
        this.setIsCertified(isCertified);
        this.setCreatedAt(createdAt);
        this.setUpdatedAt(updatedAt);
        if (experienceYears !== undefined) {
            this.setExperienceYears(experienceYears);
        }
        if (pricePerHour !== undefined) {
            this.setPricePerHour(pricePerHour);
        }
        if (notes !== undefined) {
            this.setNotes(notes);
        }
    }

    getUserId(): number {
        return this.userId;
    }

    setUserId(userId: number): void {
        this.userId = userId;
    }

    getSpecialtyId(): number {
        return this.specialtyId;
    }

    setSpecialtyId(specialtyId: number): void {
        this.specialtyId = specialtyId;
    }

    getUser(): User {
        return this.user;
    }   

    setUser(user: User): void {
        this.user = user;
    }

    getSpecialty(): Specialty {
        return this.specialty;
    }

    setSpecialty(specialty: Specialty): void {
        this.specialty = specialty;
    }   

    getExperienceYears(): number | undefined {
        return this.experienceYears;
    } 

    setExperienceYears(experienceYears: number): void {
        this.experienceYears = experienceYears;
    }   

    getPricePerHour(): number | undefined {
        return this.pricePerHour;
    }

    setPricePerHour(pricePerHour: number): void {
        this.pricePerHour = pricePerHour;
    }
    
    getNotes(): string | undefined {
        return this.notes;
    }

    setNotes(notes: string): void {
        this.notes = notes;
    } 

    getIsCertified(): boolean {
        return this.isCertified;
    }

    setIsCertified(isCertified: boolean): void {
        this.isCertified = isCertified;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    setCreatedAt(createdAt: Date): void {
        this.createdAt = createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    setUpdatedAt(updatedAt: Date): void {
        this.updatedAt = updatedAt;
    }   
}