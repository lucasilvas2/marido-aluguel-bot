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
        currentName: string
    ): string {
        return (
        `✅ Especialidade selecionada:\n*${currentName}*\n\n` +
        `Agora vamos coletar informações sobre o serviço solicitado.\n\n` +
        `📝 Descreva o seu problema de forma detalhada:\n` +
        `Exemplo: "Minha pia está vazando água, devido a um cano quebrado"\n\n` +
        `Ou digite *${MenuOption.MENU}* para cancelar e voltar ao menu.`
        );
    }

    formatServiceRequestSummary(
        specialtyName: string,
        description: string
    ): string {
        return (
            `🔧 *Resumo do Serviço Solicitado*\n\n` +
            `🛠 Especialidade: ${specialtyName}\n\n` +
            `📝 Descrição do problema:\n${description}\n\n` +
            `Por favor, confirme se as informações estão corretas:\n\n` +
            `Digite *1* para Confirmar\n` +
            `Digite *${ClientMenuOption.MENU}* para Cancelar e voltar ao menu.`
        );
    }

    formatServiceRequestConfirmation(): string {
        return (
            `✅ Seu pedido de serviço foi registrado com sucesso!\n\n` +
            `Em breve, um profissional entrará em contato com você.\n\n` +
            `Digite *${ClientMenuOption.MENU}* para voltar ao menu.`
        );
    }
}