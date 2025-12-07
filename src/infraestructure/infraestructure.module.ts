import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { MysqlModule } from "./mysql/mysql.module";
import { WhatsappWebModule } from "./whatsappWeb/whatsappWeb.module";

@Module({
    imports: [PrismaModule, MysqlModule, WhatsappWebModule],
    providers: [],
    exports: [
        PrismaModule, 
        MysqlModule, 
        WhatsappWebModule
    ],
})
export class InfraestructureModule {}