import { Injectable, Inject, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { UserSpecialty } from 'src/domain/specialties/entities/user-specialty';
import { ProfileMessageFormatter } from '../formatters/profile-message.formatter';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UserSpecialtiesServiceInterface } from 'src/domain/specialties/services/user-specialties.service.interface';
import { EventEmitterService } from 'src/application/events/event-emitter.service';
import { ProfileViewedEvent } from 'src/application/events/events/user/profile-viewed.event';
import { MenuOption } from '../enums/menu-option.enum';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';

/**
 * Handler para exibição de perfil do usuário
 * Mostra informações do usuário e especialidades (se profissional)
 */
@Injectable()
export class ProfileDisplayHandler implements ICommandHandler {
  private readonly logger = new Logger(ProfileDisplayHandler.name);

  constructor(
    private readonly profileFormatter: ProfileMessageFormatter,
    private readonly whatsappService: WhatsappWebService,
    @Inject(UserSpecialtiesServiceInterface)
    private readonly userSpecialtiesService: UserSpecialtiesServiceInterface,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  getHandlerName(): string {
    return 'ProfileDisplayHandler';
  }

  getCommands(): string[] {
    return ['perfil', 'profile', 'meu perfil', MenuOption.OPTION_THREE, '3'];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    if (!user) return false;

    if (state && state.state !== 'idle') return false;

    const lowerBody = messageBody.toLowerCase().trim();
    
    return this.getCommands().some((cmd) => {
      const lowerCmd = cmd.toLowerCase();
      return lowerBody === lowerCmd || lowerBody.includes(lowerCmd);
    });
  }

  canExecute(user: User | null, command: string): boolean {
    return user !== null;
  }

  async execute(command: string, user: User | null, args?: Record<string, any>): Promise<string> {
    if (!user) {
      return '❌ Você precisa estar cadastrado para ver seu perfil.\n\nDigite "iniciar" para fazer seu cadastro.';
    }

    this.logger.debug(`Loading profile for user ${user.getId()}`);

    let specialties: UserSpecialty[] = [];

    if (user.getUserType() === UserType.PROFESSIONAL) {
      try {
        specialties = await this.userSpecialtiesService.findByUserId(user.getId());
        this.logger.debug(`Found ${specialties.length} specialties for user ${user.getId()}`);
      } catch (error) {
        this.logger.error(`Error loading specialties for user ${user.getId()}:`, error);
        return this.profileFormatter.formatProfileErrorMessage();
      }
    }

    const phoneNumber = args?.phoneNumber || '';

    const event = new ProfileViewedEvent(
      user.getId(),
      phoneNumber,
      specialties.length > 0,
      specialties.length,
    );
    await this.eventEmitter.emit(event);

    return this.profileFormatter.formatUserProfile(user, phoneNumber, specialties);
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    this.logger.log(`Showing profile for ${message.phoneNumber}`);

    const response = await this.execute(message.body, user, {
      phoneNumber: message.phoneNumber,
    });

    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, response);

    return null;
  }
}
