export interface WhatsappMessageDto {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
  hasMedia: boolean;
  isStatus: boolean;
  isGroup: boolean;
}

export interface WhatsappContactDto {
  id: string;
  name: string;
  number: string;
  isMyContact: boolean;
}

export interface WhatsappStatusDto {
  status: 'connected' | 'disconnected' | 'initializing' | 'waiting_qr' | 'error';
  message: string;
  qrCode?: string;
  phoneNumber?: string;
}
