import { Injectable, Inject, Logger } from '@nestjs/common';
import { ICommandHandler } from './interfaces/command-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { SpecialtyMessageFormatter } from '../formatters/specialty-message.formatter';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { UserSpecialtyRegistrationService } from 'src/application/specialties/services/user-specialty-registration.service';
import { EventEmitterService } from 'src/application/events/event-emitter.service';
import { ConversationStartedEvent } from 'src/application/events/events/conversation/conversation-started.event';
import { MenuOption, ProfessionalMenuOption } from '../enums/menu-option.enum';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';

/**
 * Handler para iniciar cadastro de especialidades
 * Inicia o fluxo multi-etapa de especialidades
 */
@Injectable()
export class InitiateSpecialtyHandler implements ICommandHandler {
  private readonly logger = new Logger(InitiateSpecialtyHandler.name);

  constructor(
    private readonly specialtyFormatter: SpecialtyMessageFormatter,
    private readonly whatsappService: WhatsappWebService,
    @Inject(UsersServiceInterface)
    private readonly usersService: UsersServiceInterface,
    private readonly userSpecialtyRegistrationService: UserSpecialtyRegistrationService,
    private readonly eventEmitter: EventEmitterService,
  ) {}

  getHandlerName(): string {
    return 'InitiateSpecialtyHandler';
  }

  getCommands(): string[] {
    return [
      'especialidades',
      'cadastrar especialidades',
      'adicionar especialidades',
      ProfessionalMenuOption.CADASTRAR_ESPECIALIDADES,
      MenuOption.OPTION_ONE,
    ];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    // Apenas profissionais cadastrados podem iniciar cadastro de especialidades
    if (!user || user.getUserType() !== UserType.PROFESSIONAL) return false;

    if (state && state.state !== 'idle') return false;

    const lowerBody = messageBody.toLowerCase().trim();
    
    return this.getCommands().some((cmd) => {
      const lowerCmd = typeof cmd === 'string' ? cmd.toLowerCase() : String(cmd);
      if (/^\d+$/.test(lowerCmd)) {
        return lowerBody === lowerCmd;
      }
      return lowerBody === lowerCmd || lowerBody.includes(lowerCmd);
    });
  }

  canExecute(user: User | null, command: string): boolean {
    return user !== null && user.getUserType() === UserType.PROFESSIONAL;
  }

  async execute(command: string, user: User | null, args?: Record<string, any>): Promise<string> {
    if (!user) {
      return '❌ Você precisa estar cadastrado para registrar especialidades.\n\nDigite "iniciar" para fazer seu cadastro.';
    }

    if (user.getUserType() !== UserType.PROFESSIONAL) {
      return '❌ Apenas profissionais podem cadastrar especialidades.\n\nSe você é um profissional, entre em contato com o suporte.';
    }

    const specialties = await this.userSpecialtyRegistrationService.listUnregisteredSpecialties(user.getId());
    
    if (specialties.length === 0) {
      return '✅ Você já cadastrou todas as especialidades disponíveis!\n\nDigite *menu* para ver outras opções.';
    }

    return this.specialtyFormatter.formatSpecialtyRegistrationStart(
      user.getName(),
      specialties.map((s) => ({ id: s.getId(), name: s.getName() })),
    );
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    this.logger.log(`Initiating specialty registration for ${message.phoneNumber}`);

    if (!user || user.getUserType() !== UserType.PROFESSIONAL) {
      const response = await this.execute(message.body, user);
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, response);
      return null;
    }

    const specialties = await this.userSpecialtyRegistrationService.listUnregisteredSpecialties(user.getId());

    if (specialties.length === 0) {
      const errorMessage = '✅ Você já cadastrou todas as especialidades disponíveis!\n\nDigite *menu* para ver outras opções.';
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, errorMessage);
      return null;
    }

    const welcomeMessage = this.specialtyFormatter.formatSpecialtyRegistrationStart(
      user.getName(),
      specialties.map((s) => ({ id: s.getId(), name: s.getName() })),
    );

    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, welcomeMessage);

    const event = new ConversationStartedEvent(
      message.phoneNumber,
      'specialty',
      false,
    );
    await this.eventEmitter.emit(event);

    return {
      userId: message.phoneNumber,
      state: 'waiting_specialty_selection',
      data: {
        userId: user.getId(),
        userName: user.getName(),
        availableSpecialties: specialties.map((s) => ({ id: s.getId(), name: s.getName() })),
      },
    };
  }
}
