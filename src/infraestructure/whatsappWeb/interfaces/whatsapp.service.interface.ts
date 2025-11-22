export abstract class WhatsappServiceInterface {
    abstract getClient(): Promise<any>;
    abstract getQrCode(): Promise<string>;
    abstract initializeClient(): Promise<void>;
    abstract sendMessage(to: string, message: string): Promise<void>;
    abstract listenToMessages(callback: (message: any) => void): Promise<void>;
    abstract getConnectionStatus(): Promise<string>;
    abstract disconnect(): Promise<void>;
    abstract isReady(): boolean;
}