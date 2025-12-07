import { Test, TestingModule } from '@nestjs/testing';
import { UserRegistrationService } from '../src/application/users/services/user-registration.service';
import { UsersService } from 'src/domain/users/services/users.service';
import { AddressesService } from 'src/domain/addresses/services/addresses.service';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { AddressesServiceInterface } from 'src/domain/addresses/services/addresses.service.interface';

describe('UserRegistrationService', () => {
  let service: UserRegistrationService;
  let usersService: Partial<UsersService>;
  let addressesService: Partial<AddressesService>;

  beforeEach(async () => {
    usersService = {
      createUser: jest.fn().mockResolvedValue({ id: 'user1', name: 'John Doe' }),
    };

    addressesService = {
      createAddress: jest.fn().mockResolvedValue({ id: 'address1', street: '123 Main St' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRegistrationService,
        { provide: UsersServiceInterface, useValue: usersService },
        { provide: AddressesServiceInterface, useValue: addressesService },
      ],
    }).compile();

    service = module.get<UserRegistrationService>(UserRegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a user and address', async () => {
    const userData = { name: 'John Doe', email: 'john@example.com' };
    const addressData = { street: '123 Main St', city: 'Anytown' };

    const result = await service.registerUser(userData, addressData);

    expect(usersService.createUser).toHaveBeenCalledWith(userData);
    expect(addressesService.createAddress).toHaveBeenCalled();
    const calledWith = (addressesService.createAddress as jest.Mock).mock.calls[0][0];
    expect(calledWith).toMatchObject({ street: '123 Main St', city: 'Anytown' });
    expect(calledWith.userId).toBe('user1');
    expect(result).toEqual({
      user: { id: 'user1', name: 'John Doe' },
      address: { id: 'address1', street: '123 Main St' },
    });
  });
});