import { Module } from '@nestjs/common';
import { WhatsappController } from './controllers/whatsapp.controller';
import { InfraestructureModule } from '../infraestructure/infraestructure.module';
import { ApplicationModule } from '../application/application.module';

@Module({
  imports: [InfraestructureModule, ApplicationModule],
  controllers: [WhatsappController],
})
export class PresentationModule {}
