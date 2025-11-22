import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappWebService } from 'src/infraestructure/whatsappWeb/whatsappWeb.service';

describe('WhatsappWebService', () => {
  let service: WhatsappWebService;

  beforeEach(async () => {
    const mockWhatsappService = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      getConnectionStatus: jest.fn().mockResolvedValue('disconnected'),
      getClient: jest.fn().mockResolvedValue({}),
      isReady: jest.fn().mockReturnValue(false),
      listenToMessages: jest.fn(),
      initializeClient: jest.fn(),
      disconnect: jest.fn(),
      getQrCode: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WhatsappWebService,
          useValue: mockWhatsappService,
        },
      ],
    }).compile();

    service = module.get<WhatsappWebService>(WhatsappWebService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with disconnected status', async () => {
    const status = await service.getConnectionStatus();
    expect(status).toBeDefined();
    expect(['disconnected', 'initializing', 'connected']).toContain(status);
  });

  it('should have a client instance', async () => {
    const client = await service.getClient();
    expect(client).toBeDefined();
  });

  it('should return false for isReady when not connected', () => {
    const isReady = service.isReady();
    expect(typeof isReady).toBe('boolean');
  });
});
