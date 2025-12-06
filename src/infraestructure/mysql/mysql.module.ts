import { Module } from "@nestjs/common";
import { AddressesRepositoryInterface } from "../../domain/addresses/repositories/addresses.repository.interface";
import { UsersRepositoryInterface } from "../../domain/users/repositories/users.repository.interface";
import { AddressRepository } from "./addresses/repositories/address.repository";
import { UserRepository } from "./users/repositories/user.repository";
import { SpecialtiesRepositoryInterface } from "src/domain/specialties/repositories/specialties.repository.interface";
import { SpecialtyRepository } from "./specialties/repositories/specialty.repository";
import { UserSpecialtiesRepositoryInterface } from "src/domain/specialties/repositories/user-specialties.repository.interface";
import { UserSpecialtyRepository } from "./specialties/repositories/user-specialty.repository";
@Module({
    imports: [],
    providers: [
        { provide: AddressesRepositoryInterface, useClass: AddressRepository },
        { provide: UsersRepositoryInterface, useClass: UserRepository },
        { provide: UserSpecialtiesRepositoryInterface, useClass: UserSpecialtyRepository },
        { provide: SpecialtiesRepositoryInterface, useClass: SpecialtyRepository },
    ],
    exports: [AddressesRepositoryInterface, UsersRepositoryInterface, UserSpecialtiesRepositoryInterface, SpecialtiesRepositoryInterface],
})
export class MysqlModule {}