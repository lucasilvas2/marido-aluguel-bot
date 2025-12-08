import { Injectable } from "@nestjs/common";
import { AvailableSpecialtyDTO } from "../../dtos/available-specialty.dto";
import { MenuOption, ClientMenuOption } from '../enums/menu-option.enum';

@Injectable()
export class ServiceRequestRegistrationMessageFormatter {
    formatServiceRequestRegistrationStart(userName: string, specialties: AvailableSpecialtyDTO[]): string {
        const specialtyList = specialties
            .map((s, idx) => `${idx + 1} - ${s.name}`)
            .join('\n');

        return (
              `🔧 *Cadastro de Serviço*\n\n` +
              `Olá, ${userName}!\n\n` +
              `📋 Especialidades disponíveis:\n${specialtyList}\n\n` +
              `Digite o número da especialidade (ex: 1)\n\n` +
              `Ou digite *${MenuOption.MENU}* para cancelar e voltar ao menu.`
            );
    }

    formatSpecialtySelectionConfirmation(
    currentIndex: number,
    currentName: string
  ): string {
    return (
      `✅ Especialidades para o serviço selecionada:\n${currentName}\n\n` +
      `Agora vamos coletar informações sobre o serviço solicitado.\n\n` +
      `Descreva o seu problema de forma detalhada (Ex: "Minha pia está vazando água, devido a um cano quebrado")\n\n` +
        `Ou digite *${MenuOption.MENU}* para cancelar e voltar ao menu.`
    );
  }
}