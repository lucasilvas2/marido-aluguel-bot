import { Module } from "@nestjs/common";
import { AddressesRepositoryInterface } from "../../domain/addresses/repositories/addresses.repository.interface";
import { UsersRepositoryInterface } from "../../domain/users/repositories/users.repository.interface";
import { AddressRepository } from "./addresses/repositories/address.repository";
import { UserRepository } from "./users/repositories/user.repository";

@Module({
    imports: [],
    providers: [
        { provide: AddressesRepositoryInterface, useClass: AddressRepository },
        { provide: UsersRepositoryInterface, useClass: UserRepository },
    ],
    exports: [AddressesRepositoryInterface, UsersRepositoryInterface],
})
export class MysqlModule {}