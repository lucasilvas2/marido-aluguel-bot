import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { MysqlModule } from "./mysql/mysql.module";
import { WhatsappWebModule } from "./whatsappWeb/whatsappWeb.module";
import { UserRegistrationService } from '../application/services/user-registration.service';
import { MessageProcessingService } from '../application/services/message-processing.service';
import { ConversationStateService } from '../application/services/conversation-state.service';

@Module({
    imports: [PrismaModule, MysqlModule, WhatsappWebModule],
    providers: [
        UserRegistrationService, 
        MessageProcessingService, 
        ConversationStateService
    ],
    exports: [
        PrismaModule, 
        MysqlModule, 
        WhatsappWebModule, 
        UserRegistrationService, 
        MessageProcessingService, 
        ConversationStateService
    ],
})
export class InfraestructureModule {}