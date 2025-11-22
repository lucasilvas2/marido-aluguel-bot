import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfraestructureModule } from './infraestructure/infraestructure.module';
import { DomainModule } from './domain/domain.module';
import { PresentationModule } from './presentation/presentation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InfraestructureModule,
    DomainModule,
    PresentationModule,
  ],
})
export class AppModule {}