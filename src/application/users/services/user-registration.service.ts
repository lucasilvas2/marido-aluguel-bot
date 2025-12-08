import { Injectable, Inject } from '@nestjs/common';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { AddressesServiceInterface } from 'src/domain/addresses/services/addresses.service.interface';

@Injectable()
export class UserRegistrationService {
  constructor(
    @Inject(UsersServiceInterface)
    private readonly usersService: UsersServiceInterface,
    @Inject(AddressesServiceInterface)
    private readonly addressesService: AddressesServiceInterface,
  ) {}

  async registerUser(userData: any, addressData: any): Promise<any> {
    const user = await this.usersService.createUser(userData);

    const addressPayload = {
      street: addressData.street,
      number: addressData.number,
      neighborhood: addressData.neighborhood,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode ?? addressData.postalCode ?? '',
      country: addressData.country ?? 'BR',
      userId: user.id,
    } as any;

    const address = await this.addressesService.createAddress(addressPayload);

    return { user, address };
  }
}