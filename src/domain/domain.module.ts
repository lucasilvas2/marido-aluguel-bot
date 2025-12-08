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
        SpecialtiesServiceInterface
    ],
})
export class DomainModule {}