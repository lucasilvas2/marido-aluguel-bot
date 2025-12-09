import { Module, Provider, Global } from "@nestjs/common";
import { InfraestructureModule } from "src/infraestructure/infraestructure.module";
import { UsersServiceInterface } from "./users/services/users.service.interface";
import { UsersService } from "./users/services/users.service";
import { AddressesServiceInterface } from "./addresses/services/addresses.service.interface";
import { AddressesService } from "./addresses/services/addresses.service";
import { SpecialtiesService } from "./specialties/services/specialties.service";
import { SpecialtiesServiceInterface } from "./specialties/services/specialties.service.interface";
import { UserSpecialtiesService } from "./specialties/services/user-specialties.service";
import { UserSpecialtiesServiceInterface } from "./specialties/services/user-specialties.service.interface";
import { ServiceRequestsServiceInterface } from "./service-requests/services/service-requests.service.interface";
import { ServiceRequestsService } from "./service-requests/services/service-requests.service";
import { ServiceRequestProposalsServiceInterface } from "./service-requests/services/service-request-proposals.service.interface";
import { ServiceRequestProposalsService } from "./service-requests/services/service-request-proposals.service";

const services: Provider[] = [
    {
        provide: UsersServiceInterface,
        useClass: UsersService
    },
    {
        provide: AddressesServiceInterface,
        useClass: AddressesService
    },
    {
        provide: UserSpecialtiesServiceInterface,
        useClass: UserSpecialtiesService
    },
    {
        provide: SpecialtiesServiceInterface,
        useClass: SpecialtiesService
    },
    {
        provide: ServiceRequestsServiceInterface,
        useClass: ServiceRequestsService
    },
    {
        provide: ServiceRequestProposalsServiceInterface,
        useClass: ServiceRequestProposalsService
    }
];

@Global()
@Module({
    imports: [InfraestructureModule],
    providers: [...services],
    exports: [
        UsersServiceInterface,
        AddressesServiceInterface,
        UserSpecialtiesServiceInterface,
        SpecialtiesServiceInterface,
        ServiceRequestsServiceInterface,
        ServiceRequestProposalsServiceInterface
    ],
})
export class DomainModule {}