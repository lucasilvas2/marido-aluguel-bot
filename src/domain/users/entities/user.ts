import { Specialty } from "src/domain/specialties/entities/specialty";
import { Address } from "../../addresses/entities/address";

export class User {
    id: number;
    name: string;
    whatsappNumber: string;
    userType: number;
    address?: Address;
    specialties?: Specialty[];
    createdAt: Date;
    updatedAt: Date;

    constructor(
        id: number, 
        name: string, 
        whatsappNumber: 
        string, userType: 
        number, 
        createdAt: Date,
        updatedAt: Date,
        address?: Address,
        specialties?: Specialty[]
    ) {
        this.setId(id);
        this.setName(name);
        this.setWhatsappNumber(whatsappNumber);
        this.setUserType(userType);
        this.setCreatedAt(createdAt);
        this.setUpdatedAt(updatedAt);

        if (address) {
            this.setAddress(address);
        }

        if(specialties) {
            this.setSpecialties(specialties);
        }
    }

    getId(): number {
        return this.id;
    }

    setId(id: number): void {
        this.id = id;
    }

    getName(): string {
        return this.name;
    }

    setName(name: string): void {
        this.name = name;
    }
    getWhatsappNumber(): string {
        return this.whatsappNumber;
    }

    setWhatsappNumber(whatsappNumber: string): void {
        this.whatsappNumber = whatsappNumber;
    }

    getUserType(): number {
        return this.userType;
    }

    setUserType(userType: number): void {
        this.userType = userType;
    }

    getAddress(): Address | undefined {
        return this.address;
    }

    setAddress(address: Address): void {
        this.address = address;
    }

    getSpecialties(): Specialty[] | undefined {
        return this.specialties;
    }

    setSpecialties(specialties: Specialty[]): void {
        this.specialties = specialties;
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