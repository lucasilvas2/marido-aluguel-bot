import { Injectable, Inject, Logger } from '@nestjs/common';
import { IConversationFlowHandler } from './interfaces/conversation-flow-handler.interface';
import { ConversationMessageDTO } from '../../dtos/conversation-message.dto';
import { ConversationStateDTO } from '../../dtos/conversation-state.dto';
import { User } from 'src/domain/users/entities/user';
import { SpecialtyFlowDataDTO } from '../../dtos/specialty-flow-data.dto';
import { SpecialtyMessageFormatter } from '../formatters/specialty-message.formatter';
import { NumberValidator } from '../validators/number.validator';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';
import { UserSpecialtyRegistrationService } from 'src/application/specialties/services/user-specialty-registration.service';
import { UsersServiceInterface } from 'src/domain/users/services/users.service.interface';
import { EventEmitterService } from 'src/application/events/event-emitter.service';
import { SpecialtyAddedEvent } from 'src/application/events/events/specialty/specialty-added.event';
import { ConversationCompletedEvent } from 'src/application/events/events/conversation/conversation-completed.event';
import { MenuOption } from '../enums/menu-option.enum';
import { UserType } from 'src/domain/users/entities/enums/user-type.enum';

/**
 * Handler para o fluxo completo de cadastro de especialidades
 * Gerencia seleção e cadastro de múltiplas especialidades
 */
@Injectable()
export class SpecialtyRegistrationFlowHandler implements IConversationFlowHandler {
  private readonly logger = new Logger(SpecialtyRegistrationFlowHandler.name);
  private readonly experienceValidator: NumberValidator;
  private readonly priceValidator: NumberValidator;

  constructor(
    private readonly specialtyFormatter: SpecialtyMessageFormatter,
    private readonly whatsappService: WhatsappWebService,
    private readonly userSpecialtyRegistrationService: UserSpecialtyRegistrationService,
    @Inject(UsersServiceInterface)
    private readonly usersService: UsersServiceInterface,
    private readonly eventEmitter: EventEmitterService,
  ) {
    // Validador de experiência: 0-50 anos, apenas inteiros
    this.experienceValidator = NumberValidator.forIntegerRange(0, 50);
    // Validador de preço: maior que 0, aceita decimais
    this.priceValidator = NumberValidator.forPositive(true);
  }

  getHandlerName(): string {
    return 'SpecialtyRegistrationFlowHandler';
  }

  getHandledStates(): string[] {
    return [
      'waiting_specialty_selection',
      'waiting_specialty_experience',
      'waiting_specialty_price',
      'waiting_specialty_certification',
      'waiting_specialty_notes',
    ];
  }

  canHandle(
    state: ConversationStateDTO | null,
    user: User | null,
    messageBody: string,
  ): boolean {
    if (!state || !user) return false;
    
    // Apenas profissionais podem cadastrar especialidades
    if (user.getUserType() !== UserType.PROFESSIONAL) return false;

    return this.getHandledStates().includes(state.state);
  }

  async validateInput(
    input: string,
    currentState: ConversationStateDTO,
  ): Promise<{ isValid: boolean; errorMessage?: string }> {
    const { state, data } = currentState;
    const flowData = data as SpecialtyFlowDataDTO;
    const trimmedInput = input.trim().toLowerCase();

    // Permitir cancelamento em qualquer etapa
    if (trimmedInput === 'cancelar' || trimmedInput === MenuOption.MENU) {
      return { isValid: true };
    }

    // Validação de seleção de especialidades
    if (state === 'waiting_specialty_selection') {
      const selectedNumbers = trimmedInput
        .split(',')
        .map((n) => parseInt(n.trim()))
        .filter((n) => !isNaN(n) && n > 0);

      if (selectedNumbers.length === 0) {
        return {
          isValid: false,
          errorMessage:
            '❌ Nenhuma especialidade válida foi selecionada.\n\nPor favor, digite os números separados por vírgula (ex: 1,3,5) ou "cancelar".',
        };
      }

      const availableSpecialties = flowData.availableSpecialties || [];
      const validSelections = selectedNumbers.filter((n) => n <= availableSpecialties.length);

      if (validSelections.length === 0) {
        return {
          isValid: false,
          errorMessage: `❌ Números inválidos. Por favor, escolha entre 1 e ${availableSpecialties.length}.`,
        };
      }

      // Verifica se alguma especialidade selecionada já está cadastrada
      const selectedIds = validSelections.map(n => availableSpecialties[n - 1].id);
      const userSpecialties = await this.userSpecialtyRegistrationService.getUserSpecialties(flowData.userId);
      const registeredIds = userSpecialties.map(us => us.getSpecialtyId());
      const duplicates = selectedIds.filter(id => registeredIds.includes(id));

      if (duplicates.length > 0) {
        const duplicateNames = duplicates.map(id => {
          const specialty = availableSpecialties.find(s => s.id === id);
          return specialty?.name || 'Desconhecida';
        });
        
        return {
          isValid: false,
          errorMessage: `❌ Especialidade(s) já cadastrada(s): ${duplicateNames.join(', ')}\n\nPor favor, selecione apenas especialidades que você ainda não cadastrou.`,
        };
      }
    }

    // Validação de anos de experiência
    if (state === 'waiting_specialty_experience') {
      if (!this.experienceValidator.isValid(input)) {
        return {
          isValid: false,
          errorMessage: this.experienceValidator.getErrorMessage(),
        };
      }
    }

    // Validação de preço
    if (state === 'waiting_specialty_price') {
      if (!this.priceValidator.isValid(input)) {
        return {
          isValid: false,
          errorMessage: this.priceValidator.getErrorMessage(),
        };
      }
    }

    // Validação de certificação
    if (state === 'waiting_specialty_certification') {
      const validOptions = ['1', 'sim', '2', 'não', 'nao'];
      if (!validOptions.includes(trimmedInput)) {
        return {
          isValid: false,
          errorMessage: '❌ Por favor, digite 1 para Sim, 2 para Não, ou *0* para cancelar.',
        };
      }
    }

    return { isValid: true };
  }

  async processStep(
    message: ConversationMessageDTO,
    state: ConversationStateDTO,
  ): Promise<ConversationStateDTO | null> {
    const { state: currentState, data } = state;
    const flowData = data as SpecialtyFlowDataDTO;

    // Verificar cancelamento
    const trimmedBody = message.body.trim().toLowerCase();
    if (trimmedBody === 'cancelar' || trimmedBody === MenuOption.MENU) {
      const cancelMessage = this.specialtyFormatter.formatCancellationMessage();
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, cancelMessage);
      return null; // Limpa estado
    }

    switch (currentState) {
      case 'waiting_specialty_selection':
        return await this.handleSpecialtySelection(message, flowData);

      case 'waiting_specialty_experience':
        return await this.handleExperience(message, flowData);

      case 'waiting_specialty_price':
        return await this.handlePrice(message, flowData);

      case 'waiting_specialty_certification':
        return await this.handleCertification(message, flowData);

      case 'waiting_specialty_notes':
        return await this.handleNotes(message, flowData);

      default:
        return null;
    }
  }

  async handle(
    message: ConversationMessageDTO,
    state: ConversationStateDTO | null,
    user: User | null,
  ): Promise<ConversationStateDTO | null> {
    if (!state || !user) return null;

    this.logger.log(`Processing specialty step: ${state.state} for ${message.phoneNumber}`);

    // Valida input
    const validation = await this.validateInput(message.body, state);
    if (!validation.isValid) {
      await this.whatsappService.sendMessage(
        `${message.phoneNumber}@c.us`,
        validation.errorMessage!,
      );
      return state; // Mantém estado atual
    }

    // Processa passo
    return await this.processStep(message, state);
  }

  private async handleSpecialtySelection(
    message: ConversationMessageDTO,
    data: SpecialtyFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const trimmedBody = message.body.trim().toLowerCase();

    // Parse selected specialty numbers (posições na lista exibida: 1, 2, 3...)
    const selectedNumbers = trimmedBody
      .split(',')
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    const availableSpecialties = data.availableSpecialties || [];
    const validSelections = selectedNumbers.filter((n) => n <= availableSpecialties.length);

    // Mapeia as posições selecionadas (1, 2, 3...) para os IDs reais do banco
    const selectedSpecialtyIds = validSelections.map((n) => availableSpecialties[n - 1].id);
    const selectedSpecialtyNames = validSelections.map((n) => availableSpecialties[n - 1].name);

    this.logger.debug(
      `User selected positions: ${validSelections.join(', ')} ` +
      `-> Specialty IDs: ${selectedSpecialtyIds.join(', ')} ` +
      `(${selectedSpecialtyNames.join(', ')})`
    );

    const confirmationMessage = this.specialtyFormatter.formatSpecialtySelectionConfirmation(
      selectedSpecialtyNames,
      0,
      selectedSpecialtyNames[0],
    );

    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, confirmationMessage);

    return {
      userId: message.phoneNumber,
      state: 'waiting_specialty_experience',
      data: {
        ...data,
        selectedSpecialtyIds,
        selectedSpecialtyNames,
        currentSpecialtyIndex: 0,
        specialtiesData: [],
      },
    };
  }

  private async handleExperience(
    message: ConversationMessageDTO,
    data: SpecialtyFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const experienceYears = this.experienceValidator.sanitize(message.body);
    const currentSpecialtyName = data.selectedSpecialtyNames![data.currentSpecialtyIndex!];

    const confirmationMessage = this.specialtyFormatter.formatExperienceConfirmation(
      experienceYears,
      currentSpecialtyName,
    );

    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, confirmationMessage);

    return {
      userId: message.phoneNumber,
      state: 'waiting_specialty_price',
      data: {
        ...data,
        currentExperienceYears: experienceYears,
      },
    };
  }

  private async handlePrice(
    message: ConversationMessageDTO,
    data: SpecialtyFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const pricePerHour = this.priceValidator.sanitize(message.body);

    const confirmationMessage = this.specialtyFormatter.formatPriceConfirmation(pricePerHour);

    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, confirmationMessage);

    return {
      userId: message.phoneNumber,
      state: 'waiting_specialty_certification',
      data: {
        ...data,
        currentPricePerHour: pricePerHour,
      },
    };
  }

  private async handleCertification(
    message: ConversationMessageDTO,
    data: SpecialtyFlowDataDTO,
  ): Promise<ConversationStateDTO> {
    const trimmedBody = message.body.trim().toLowerCase();
    
    // 1 ou 'sim' = certificado
    // 2 ou 'não'/'nao' = não certificado
    const isCertified = trimmedBody === '1' || trimmedBody === 'sim';

    const confirmationMessage = this.specialtyFormatter.formatCertificationConfirmation(isCertified);

    await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, confirmationMessage);

    return {
      userId: message.phoneNumber,
      state: 'waiting_specialty_notes',
      data: {
        ...data,
        currentIsCertified: isCertified,
      },
    };
  }

  private async handleNotes(
    message: ConversationMessageDTO,
    data: SpecialtyFlowDataDTO,
  ): Promise<ConversationStateDTO | null> {
    const trimmedBody = message.body.trim().toLowerCase();
    const notes = trimmedBody === 'pular' ? undefined : message.body.trim();

    try {
      // Verifica se a especialidade já está cadastrada (proteção adicional)
      const userSpecialties = await this.userSpecialtyRegistrationService.getUserSpecialties(data.userId);
      const specialtyId = data.selectedSpecialtyIds![data.currentSpecialtyIndex!];
      const alreadyRegistered = userSpecialties.some(us => us.getSpecialtyId() === specialtyId);

      if (alreadyRegistered) {
        const specialtyName = data.selectedSpecialtyNames![data.currentSpecialtyIndex!];
        const errorMessage = `⚠️ Você já possui a especialidade "${specialtyName}" cadastrada!\n\nPulando para a próxima...`;
        await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, errorMessage);
        
        // Pula para a próxima especialidade
        const nextIndex = data.currentSpecialtyIndex! + 1;
        
        if (nextIndex < data.selectedSpecialtyIds!.length) {
          const nextSpecialtyName = data.selectedSpecialtyNames![nextIndex];
          const nextMessage = this.specialtyFormatter.formatNextSpecialtyPrompt(
            nextIndex,
            data.selectedSpecialtyIds!.length,
            nextSpecialtyName,
          );
          await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, nextMessage);

          return {
            userId: message.phoneNumber,
            state: 'waiting_specialty_experience',
            data: {
              ...data,
              currentSpecialtyIndex: nextIndex,
              currentExperienceYears: undefined,
              currentPricePerHour: undefined,
              currentIsCertified: undefined,
            },
          };
        } else {
          // Não há mais especialidades
          const completedEvent = new ConversationCompletedEvent(
            message.phoneNumber,
            'specialty',
            'success',
            0,
            0,
          );
          await this.eventEmitter.emit(completedEvent);
          return null;
        }
      }

      // Registra especialidade
      await this.userSpecialtyRegistrationService.registerUserSpecialty(
        data.userId,
        specialtyId,
        data.currentExperienceYears!,
        data.currentPricePerHour!,
        notes,
        data.currentIsCertified!,
      );

      this.logger.log(
        `Specialty ${data.selectedSpecialtyIds![data.currentSpecialtyIndex!]} registered for user ${data.userId}`,
      );

      // Emite evento
      const event = new SpecialtyAddedEvent(
        data.userId,
        message.phoneNumber,
        data.selectedSpecialtyIds![data.currentSpecialtyIndex!],
        data.selectedSpecialtyNames![data.currentSpecialtyIndex!],
        data.currentExperienceYears!,
        data.currentPricePerHour!,
        data.currentIsCertified!,
      );
      await this.eventEmitter.emit(event);

      // Adiciona aos dados coletados
      const specialtiesData = [
        ...(data.specialtiesData || []),
        {
          name: data.selectedSpecialtyNames![data.currentSpecialtyIndex!],
          experience: data.currentExperienceYears!,
          price: data.currentPricePerHour!,
          certified: data.currentIsCertified!,
          notes: notes,
        },
      ];

      const nextIndex = data.currentSpecialtyIndex! + 1;

      // Verifica se há mais especialidades
      if (nextIndex < data.selectedSpecialtyIds!.length) {
        const nextSpecialtyName = data.selectedSpecialtyNames![nextIndex];

        const nextMessage = this.specialtyFormatter.formatNextSpecialtyPrompt(
          nextIndex,
          data.selectedSpecialtyIds!.length,
          nextSpecialtyName,
        );

        await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, nextMessage);

        return {
          userId: message.phoneNumber,
          state: 'waiting_specialty_experience',
          data: {
            ...data,
            currentSpecialtyIndex: nextIndex,
            specialtiesData,
            currentExperienceYears: undefined,
            currentPricePerHour: undefined,
            currentIsCertified: undefined,
          },
        };
      } else {
        // Todas as especialidades foram cadastradas
        const summaryMessage = this.specialtyFormatter.formatSpecialtySummary(specialtiesData);
        await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, summaryMessage);

        // Emite evento de conversa completada
        const completedEvent = new ConversationCompletedEvent(
          message.phoneNumber,
          'specialty',
          'success',
          0, // Duração não rastreada neste handler
          specialtiesData.length * 5, // 5 passos por especialidade
        );
        await this.eventEmitter.emit(completedEvent);

        return null; // Limpa estado
      }
    } catch (error) {
      this.logger.error(`Error registering specialty for user ${data.userId}:`, error);

      const errorMessage = this.specialtyFormatter.formatRegistrationErrorMessage();
      await this.whatsappService.sendMessage(`${message.phoneNumber}@c.us`, errorMessage);

      // Emite evento de erro
      const completedEvent = new ConversationCompletedEvent(
        message.phoneNumber,
        'specialty',
        'error',
        0,
        data.currentSpecialtyIndex! * 5,
      );
      await this.eventEmitter.emit(completedEvent);

      return null; // Limpa estado
    }
  }
}
