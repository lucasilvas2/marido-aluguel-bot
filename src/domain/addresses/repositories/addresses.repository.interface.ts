import { Address } from "../entities/address";

export abstract class AddressesRepositoryInterface {
    abstract create(data: { street: string; city: string; zipCode: string; country: string; number?: string; state: string; neighborhood: string; userId: number }): Promise<Address>;
    abstract findById(id: number): Promise<Address | null>;
    abstract findAll(): Promise<Address[]>;
    abstract update(id: number, data: Partial<{ street: string; city: string; zipCode: string; country: string; number?: string }>): Promise<Address>;
    abstract delete(id: number): Promise<Address>;
}