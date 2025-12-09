import { Module } from "@nestjs/common";
import { AddressesRepositoryInterface } from "../../domain/addresses/repositories/addresses.repository.interface";
import { UsersRepositoryInterface } from "../../domain/users/repositories/users.repository.interface";
import { AddressRepository } from "./addresses/repositories/address.repository";
import { UserRepository } from "./users/repositories/user.repository";
import { SpecialtiesRepositoryInterface } from "src/domain/specialties/repositories/specialties.repository.interface";
import { SpecialtyRepository } from "./specialties/repositories/specialty.repository";
import { UserSpecialtiesRepositoryInterface } from "src/domain/specialties/repositories/user-specialties.repository.interface";
import { UserSpecialtyRepository } from "./specialties/repositories/user-specialty.repository";
import { ServiceRequestsRepositoryInterface } from "src/domain/service-requests/repositories/service-requests.repository.interface";
import { ServiceRequestRepository } from "./service-requests/repositories/service-request.repository";
import { ServiceRequestProposalsRepositoryInterface } from "src/domain/service-requests/repositories/service-request-proposals.repository.interface";
import { ServiceRequestProposalRepository } from "./service-requests/repositories/service-request-proposal.repository";
@Module({
    imports: [],
    providers: [
        { provide: AddressesRepositoryInterface, useClass: AddressRepository },
        { provide: UsersRepositoryInterface, useClass: UserRepository },
        { provide: UserSpecialtiesRepositoryInterface, useClass: UserSpecialtyRepository },
        { provide: SpecialtiesRepositoryInterface, useClass: SpecialtyRepository },
        { provide: ServiceRequestsRepositoryInterface, useClass: ServiceRequestRepository },
        { provide: ServiceRequestProposalsRepositoryInterface, useClass: ServiceRequestProposalRepository },
    ],
    exports: [
        AddressesRepositoryInterface, 
        UsersRepositoryInterface, 
        UserSpecialtiesRepositoryInterface, 
        SpecialtiesRepositoryInterface, 
        ServiceRequestsRepositoryInterface,
        ServiceRequestProposalsRepositoryInterface
    ],
})
export class MysqlModule {}