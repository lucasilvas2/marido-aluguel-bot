import { Address } from "cluster";

export class User {
    id: string;
    name: string;
    whatsappNumber: string;
    userType: number;
    address?: Address;

    constructor(id: string, name: string, whatsappNumber: string, userType: number, address?: Address) {
        this.setId(id);
        this.setName(name);
        this.setWhatsappNumber(whatsappNumber);
        this.setUserType(userType);
        if (address) {
            this.setAddress(address);
        }
    }

    getId(): string {
        return this.id;
    }

    setId(id: string): void {
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

}