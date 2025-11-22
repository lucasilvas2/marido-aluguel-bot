import { Controller, Get, Post, Res } from '@nestjs/common';
import { WhatsappWebService } from '../../infraestructure/whatsappWeb/whatsappWeb.service';
import { Response } from 'express';
import * as QRCode from 'qrcode';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappWebService: WhatsappWebService) {}

  @Get('status')
  async getStatus() {
    const status = await this.whatsappWebService.getConnectionStatus();
    return {
      status,
      message: this.getStatusMessage(status),
    };
  }

  @Get('qrcode')
  async getQrCode() {
    const status = await this.whatsappWebService.getConnectionStatus();

    if (status === 'connected') {
      return {
        status: 'connected',
        message: 'WhatsApp já está conectado',
      };
    }

    if (status === 'disconnected') {
      await this.whatsappWebService.initializeClient();
    }

    try {
      const qrCode = await this.whatsappWebService.getQrCode();
      return {
        status: 'waiting_qr',
        qrCode,
        message: 'Escaneie o QR Code com seu WhatsApp',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao gerar QR Code',
        error: error.message,
      };
    }
  }

  @Get('qrcode/image')
  async getQrCodeImage(@Res() res: Response) {
    try {
      const status = await this.whatsappWebService.getConnectionStatus();

      if (status === 'connected') {
        res.status(400).json({
          status: 'connected',
          message: 'WhatsApp já está conectado',
        });
        return;
      }

      if (status === 'disconnected') {
        await this.whatsappWebService.initializeClient();
      }

      const qrCode = await this.whatsappWebService.getQrCode();
      
      // Gera a imagem do QR Code como PNG buffer
      const qrImageBuffer = await QRCode.toBuffer(qrCode, {
        type: 'png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': qrImageBuffer.length,
      });
      
      res.send(qrImageBuffer);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Erro ao gerar QR Code',
        error: error.message,
      });
    }
  }

  @Post('disconnect')
  async disconnect() {
    await this.whatsappWebService.disconnect();
    return {
      status: 'disconnected',
      message: 'WhatsApp desconectado com sucesso',
    };
  }

  @Post('restart')
  async restart() {
    await this.whatsappWebService.disconnect();
    await this.whatsappWebService.initializeClient();
    return {
      status: 'restarting',
      message: 'WhatsApp reiniciando...',
    };
  }

  private getStatusMessage(status: string): string {
    const messages = {
      connected: 'WhatsApp conectado e pronto',
      disconnected: 'WhatsApp desconectado',
      initializing: 'WhatsApp inicializando...',
      waiting_qr: 'Aguardando leitura do QR Code',
      error: 'Erro na conexão do WhatsApp',
    };
    return messages[status] || 'Status desconhecido';
  }
}
