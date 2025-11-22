import { Module } from "@nestjs/common";
import { WhatsappWebService } from "./whatsappWeb.service";

@Module({
    imports: [],
    providers: [WhatsappWebService],
    exports: [WhatsappWebService],
})
export class WhatsappWebModule {}