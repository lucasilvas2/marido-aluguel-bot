import { Address } from "../entities/address";

export abstract class AddressesServiceInterface {
    abstract createAddress(data: { street: string; city: string; zipCode: string; country: string; number?: string; state: string; neighborhood: string; userId: string }): Promise<Address>;
    abstract getAddressById(id: string): Promise<Address | null>;
    abstract getAllAddresses(): Promise<Address[]>;
    abstract updateAddress(id: string, data: Partial<{ street: string; city: string; zipCode: string; country: string; number?: string }>): Promise<Address>;
    abstract deleteAddress(id: string): Promise<Address>;
}