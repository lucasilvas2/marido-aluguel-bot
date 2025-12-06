import { Module } from '@nestjs/common';
import { WhatsappController } from './controllers/whatsapp.controller';
import { InfraestructureModule } from '../infraestructure/infraestructure.module';
import { ApplicationModule } from '../application/application.module';
import { SpecialtyController } from './controllers/specialty.controller';

@Module({
  imports: [InfraestructureModule, ApplicationModule],
  controllers: [WhatsappController, SpecialtyController],
})
export class PresentationModule {}
