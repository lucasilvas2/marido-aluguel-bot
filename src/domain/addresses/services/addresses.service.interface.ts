import { Address } from "../entities/address";

export abstract class AddressesServiceInterface {
    abstract createAddress(data: { street: string; city: string; zipCode: string; country: string; number?: string; state: string; neighborhood: string; userId: number }): Promise<Address>;
    abstract getAddressById(id: number): Promise<Address | null>;
    abstract getAllAddresses(): Promise<Address[]>;
    abstract updateAddress(id: number, data: Partial<{ street: string; city: string; zipCode: string; country: string; number?: string }>): Promise<Address>;
    abstract deleteAddress(id: number): Promise<Address>;
}