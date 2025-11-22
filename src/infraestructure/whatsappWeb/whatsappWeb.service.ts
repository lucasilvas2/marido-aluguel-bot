import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
const { Client, LocalAuth } = require('whatsapp-web.js');
import { WhatsappServiceInterface } from './interfaces/whatsapp.service.interface';

@Injectable()
export class WhatsappWebService implements WhatsappServiceInterface, OnModuleInit {
    private client: any;
    private readonly logger = new Logger(WhatsappWebService.name);
    private connectionStatus: string = 'disconnected';
    private qrCodeData: string | null = null;
    private isClientReady: boolean = false;
    private messageCallback: ((message: any) => void) | null = null;

    constructor() {
        this.initializeClient();
    }

    async onModuleInit() {
        this.logger.log('WhatsApp service module initialized');
    }

    async getClient(): Promise<any> {
        return this.client;
    }

    async getQrCode(): Promise<string> {
        if (this.connectionStatus === 'connected') {
            throw new Error('WhatsApp já está conectado');
        }

        if (this.qrCodeData) {
            return this.qrCodeData;
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout ao gerar QR Code'));
            }, 60000);

            this.client.once('qr', (qr: string) => {
                clearTimeout(timeout);
                this.qrCodeData = qr;
                resolve(qr);
            });
        });
    }

    async initializeClient(): Promise<void> {
        try {
            if (this.client) {
                await this.disconnect();
            }

            this.connectionStatus = 'initializing';
            this.isClientReady = false;
            this.qrCodeData = null;

            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: './whatsapp-session'
                }),
                puppeteer: {
                    headless: true,
                    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--disable-gpu'
                    ]
                }
            });

            this.setupEventHandlers();
            
            await this.client.initialize();
            this.logger.log('WhatsApp client initialization started');
        } catch (error) {
            this.logger.error('Error initializing WhatsApp client', error);
            this.connectionStatus = 'error';
            throw error;
        }
    }

    private setupEventHandlers(): void {
        this.client.on('qr', (qr: string) => {
            this.logger.log('QR Code received');
            this.qrCodeData = qr;
            this.connectionStatus = 'waiting_qr';
        });

        this.client.on('ready', () => {
            this.logger.log('WhatsApp client is ready!');
            this.connectionStatus = 'connected';
            this.isClientReady = true;
            this.qrCodeData = null;
        });

        this.client.on('authenticated', () => {
            this.logger.log('WhatsApp authenticated successfully');
        });

        this.client.on('auth_failure', (msg: any) => {
            this.logger.error('Authentication failure', msg);
            this.connectionStatus = 'error';
            this.isClientReady = false;
        });

        this.client.on('disconnected', (reason: any) => {
            this.logger.warn('WhatsApp client disconnected', reason);
            this.connectionStatus = 'disconnected';
            this.isClientReady = false;
            this.qrCodeData = null;
        });

        this.client.on('message', async (message: any) => {
            if (!message.fromMe && !message.isStatus) {
                this.logger.log(`Message received from ${message.from}: ${message.body}`);
                
                if (this.messageCallback) {
                    try {
                        await this.messageCallback(message);
                    } catch (error) {
                        this.logger.error('Error processing message', error);
                    }
                }
            }
        });

        this.client.on('message_create', (message: any) => {
            if (message.fromMe) {
                this.logger.debug(`Message sent to ${message.to}: ${message.body}`);
            }
        });

        this.client.on('loading_screen', (percent: number, message: string) => {
            this.logger.debug(`Loading screen: ${percent}% - ${message}`);
        });
    }

    async sendMessage(to: string, message: string): Promise<void> {
        if (!this.isClientReady) {
            throw new Error('WhatsApp client is not ready. Please wait for connection.');
        }

        try {
            const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
            await this.client.sendMessage(chatId, message);
            this.logger.log(`Message sent to ${chatId}: ${message}`);
        } catch (error) {
            this.logger.error(`Error sending message to ${to}`, error);
            throw error;
        }
    }

    async listenToMessages(callback: (message: any) => void): Promise<void> {
        this.messageCallback = callback;
        this.logger.log('Message callback registered');
    }

    async getConnectionStatus(): Promise<string> {
        return this.connectionStatus;
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            try {
                await this.client.destroy();
                this.logger.log('WhatsApp client disconnected');
            } catch (error) {
                this.logger.error('Error disconnecting client', error);
            }
        }
        this.connectionStatus = 'disconnected';
        this.isClientReady = false;
        this.qrCodeData = null;
        this.messageCallback = null;
    }

    isReady(): boolean {
        return this.isClientReady;
    }

    async getClientInfo(): Promise<any> {
        if (!this.isClientReady) {
            throw new Error('WhatsApp client is not ready');
        }

        try {
            const info = await this.client.info;
            return {
                phoneNumber: info.wid.user,
                platform: info.platform,
                pushname: info.pushname,
            };
        } catch (error) {
            this.logger.error('Error getting client info', error);
            throw error;
        }
    }
}