import { Address } from "../entities/address";

export abstract class AddressesRepositoryInterface {
    abstract create(data: { street: string; city: string; zipCode: string; country: string; number?: string; state: string; neighborhood: string; userId: string }): Promise<Address>;
    abstract findById(id: string): Promise<Address | null>;
    abstract findAll(): Promise<Address[]>;
    abstract update(id: string, data: Partial<{ street: string; city: string; zipCode: string; country: string; number?: string }>): Promise<Address>;
    abstract delete(id: string): Promise<Address>;
}