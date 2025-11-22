import { Module, Provider, Global } from "@nestjs/common";
import { InfraestructureModule } from "src/infraestructure/infraestructure.module";
import { UsersServiceInterface } from "./users/services/users.service.interface";
import { UsersService } from "./users/services/users.service";
import { AddressesServiceInterface } from "./addresses/services/addresses.service.interface";
import { AddressesService } from "./addresses/services/addresses.service";

const services: Provider[] = [
    {
        provide: UsersServiceInterface,
        useClass: UsersService
    },
    {
        provide: AddressesServiceInterface,
        useClass: AddressesService
    }
];

@Global()
@Module({
    imports: [InfraestructureModule],
    providers: [...services],
    exports: [
        UsersServiceInterface,
        AddressesServiceInterface
    ],
})
export class DomainModule {}