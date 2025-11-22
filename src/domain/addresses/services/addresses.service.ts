import { Injectable } from "@nestjs/common";
import { AddressesRepositoryInterface } from "../repositories/addresses.repository.interface";
import { AddressesServiceInterface } from "./addresses.service.interface";
import { Address } from "../entities/address";

@Injectable()
export class AddressesService implements AddressesServiceInterface {
    constructor(private readonly addressesRepository: AddressesRepositoryInterface) {}

    async createAddress(data: { street: string; city: string; zipCode: string; country: string; number?: string; state: string; neighborhood: string; userId: string }): Promise<Address> {
        return this.addressesRepository.create(data);
    }
    getAddressById(id: string): Promise<Address | null> {
        return this.addressesRepository.findById(id);
    }
    getAllAddresses(): Promise<Address[]> {
        return this.addressesRepository.findAll();
    }
    updateAddress(id: string, data: Partial<{ street: string; city: string; zipCode: string; country: string; number?: string }>): Promise<Address> {
        return this.addressesRepository.update(id, data);
    }

    deleteAddress(id: string): Promise<Address> {
        return this.addressesRepository.delete(id);
    }
}