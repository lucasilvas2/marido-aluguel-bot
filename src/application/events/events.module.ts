import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitterService } from './event-emitter.service';
import { AuditListener } from './listeners/audit.listener';
import { AnalyticsListener } from './listeners/analytics.listener';
import { ServiceRequestNotificationListener } from './listeners/service-request-notification.listener';
import { InfraestructureModule } from 'src/infraestructure/infraestructure.module';
import { DomainModule } from 'src/domain/domain.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Use wildcards
      wildcard: true,
      // The delimiter used to segment namespaces
      delimiter: '.',
      // Maximum listeners that can be assigned to an event
      maxListeners: 10,
      // Show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: true,
    }),
    InfraestructureModule,
    DomainModule,
  ],
  providers: [
    EventEmitterService, 
    AuditListener, 
    AnalyticsListener,
    ServiceRequestNotificationListener,
  ],
  exports: [EventEmitterService],
})
export class EventsModule {}
