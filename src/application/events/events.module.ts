import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitterService } from './event-emitter.service';
import { AuditListener } from './listeners/audit.listener';
import { AnalyticsListener } from './listeners/analytics.listener';

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
  ],
  providers: [EventEmitterService, AuditListener, AnalyticsListener],
  exports: [EventEmitterService],
})
export class EventsModule {}
