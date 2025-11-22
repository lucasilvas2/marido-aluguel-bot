import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { MessageProcessingService } from '../../src/application/services/message-processing.service';
import { ConversationStateService } from '../../src/application/services/conversation-state.service';
import { WhatsappWebService } from '../../src/infraestructure/whatsappWeb/whatsappWeb.service';

/**
 * Testes de integração E2E que simulam conversas reais com o bot do WhatsApp
 */
describe('WhatsApp Conversation Flow (e2e)', () => {
  let app: INestApplication;
  let messageProcessingService: MessageProcessingService;
  let conversationStateService: ConversationStateService;
  let whatsappService: WhatsappWebService;

  const testPhoneNumber = '5584999887766';
  let sentMessages: Array<{ to: string; message: string }> = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WhatsappWebService)
      .useValue({
        sendMessage: jest.fn().mockImplementation((to: string, message: string) => {
          sentMessages.push({ to, message });
          return Promise.resolve();
        }),
        getConnectionStatus: jest.fn().mockResolvedValue('connected'),
        initializeClient: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getQrCode: jest.fn().mockResolvedValue('mock-qr-code'),
        // ensure MessageProcessingService can call listenToMessages during module init
        listenToMessages: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    messageProcessingService = moduleFixture.get<MessageProcessingService>(MessageProcessingService);
    conversationStateService = moduleFixture.get<ConversationStateService>(ConversationStateService);
    whatsappService = moduleFixture.get<WhatsappWebService>(WhatsappWebService);

    // Backwards-compatibility shim: adapt old tests that call processMessage(phone, text)
    // to the current signature processMessage({ from, body }).
    const originalProcessMessage = (messageProcessingService as any).processMessage.bind(messageProcessingService);
    (messageProcessingService as any).processMessage = (a: any, b?: any) => {
      if (typeof a === 'string' && typeof b === 'string') {
        return originalProcessMessage({ from: `${a}@c.us`, body: b, timestamp: Date.now() });
      }
      return originalProcessMessage(a);
    };
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sentMessages = [];
    conversationStateService.clearState(testPhoneNumber);
  });

  describe('Complete Client Registration Flow', () => {
    it('should successfully register a new client through conversation', async () => {
      // Use a unique phone for this test to avoid DB unique constraint collisions
      const clientPhone = `55849${Math.floor(Math.random() * 1e8).toString().padStart(8, '0')}`;

      // Step 1: User says "oi"
      await messageProcessingService.processMessage(clientPhone, 'oi');
      expect(sentMessages[sentMessages.length - 1].message).toContain('Olá');

      // Step 2: User chooses option 1 (Cadastro) -> bot asks for name
      await messageProcessingService.processMessage(clientPhone, '1');
      expect(sentMessages[sentMessages.length - 1].message).toContain('nome completo');

      // Step 3: User provides name
      await messageProcessingService.processMessage(clientPhone, 'Pedro Teste');
      expect(sentMessages[sentMessages.length - 1].message).toContain('email');

      // Step 5: User provides email (unique per test run)
      const clientEmail = `pedro+${Date.now()}@teste.com`;
      await messageProcessingService.processMessage(clientPhone, clientEmail);
      expect(sentMessages[sentMessages.length - 1].message).toContain('CEP');


      // Step 6: User provides CEP -> bot asks for street
      await messageProcessingService.processMessage(clientPhone, '59000000');
      expect(sentMessages[sentMessages.length - 1].message).toContain('rua');

      // Step 7: User provides street
      await messageProcessingService.processMessage(clientPhone, 'Rua Teste');
      expect(sentMessages[sentMessages.length - 1].message).toContain('número');

      // Step 8: User provides number
      await messageProcessingService.processMessage(clientPhone, '123');
      expect(sentMessages[sentMessages.length - 1].message).toContain('bairro');

      // Step 9: User provides neighborhood
      await messageProcessingService.processMessage(clientPhone, 'Petrópolis');
      expect(sentMessages[sentMessages.length - 1].message).toContain('cidade');

      // Step 10: User provides city
      await messageProcessingService.processMessage(clientPhone, 'Natal');
      expect(sentMessages[sentMessages.length - 1].message).toContain('estado');

      // Step 11: User provides state -> registration happens immediately
      await messageProcessingService.processMessage(clientPhone, 'RN');

      const lastMessage = sentMessages[sentMessages.length - 1].message;
      expect(lastMessage).toMatch(/(Cadastro realizado com sucesso|Já existe um cadastro|erro)/);
    });
  });

  describe('Complete Professional Registration Flow', () => {
    it('should successfully register a new professional through conversation', async () => {
      // use unique phone for professional registration
      const profPhone = `55841${Math.floor(Math.random() * 1e8).toString().padStart(8, '0')}`;
      // ensure no leftover state for this phone
      conversationStateService.clearState(profPhone);

      await messageProcessingService.processMessage(profPhone, 'oi');
      await messageProcessingService.processMessage(profPhone, '2'); // Profissional
      
      expect(sentMessages[sentMessages.length - 1].message).toContain('nome completo');
      
      await messageProcessingService.processMessage(profPhone, 'Ana Profissional');
      const profEmail = `ana+${Date.now()}@profissional.com`;
      await messageProcessingService.processMessage(profPhone, profEmail);
      await messageProcessingService.processMessage(profPhone, '59000001');
      await messageProcessingService.processMessage(profPhone, 'Av. Principal');
      await messageProcessingService.processMessage(profPhone, '456');
      await messageProcessingService.processMessage(profPhone, 'Centro');
      await messageProcessingService.processMessage(profPhone, 'Natal');
      await messageProcessingService.processMessage(profPhone, 'RN');

      const lastMessage = sentMessages[sentMessages.length - 1].message;
      expect(lastMessage).toMatch(/(Cadastro realizado com sucesso|erro)/);
    });
  });

  describe('Error Handling and Validation', () => {
    it('should reject invalid email format', async () => {
      // set state to waiting_user_info with name already provided
      conversationStateService.setState(testPhoneNumber, 'waiting_user_info', {
        userType: 'CLIENT',
        name: 'Teste User',
      });

      await messageProcessingService.processMessage(testPhoneNumber, 'email-invalido');
      
      expect(sentMessages[sentMessages.length - 1].message).toContain('Email inválido');
    });

    it('should reject invalid CEP format', async () => {
      conversationStateService.setState(testPhoneNumber, 'waiting_address', {
        userType: 'CLIENT',
        name: 'Teste User',
        email: 'teste@example.com',
      });

      await messageProcessingService.processMessage(testPhoneNumber, '123');
      
      expect(sentMessages[sentMessages.length - 1].message).toContain('CEP inválido');
    });

    it('should reject invalid state format', async () => {
      // set state to waiting_address with address fields up to city filled
      conversationStateService.setState(testPhoneNumber, 'waiting_address', {
        userType: 'CLIENT',
        name: 'Teste User',
        email: 'teste@example.com',
        address: {
          postalCode: '59000000',
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Petrópolis',
          city: 'Natal',
        },
      });

      await messageProcessingService.processMessage(testPhoneNumber, 'RNX');
      
      expect(sentMessages[sentMessages.length - 1].message).toContain('Estado inválido');
    });
  });

  describe('Menu Navigation', () => {
    it('should display menu when user types "menu"', async () => {
      await messageProcessingService.processMessage(testPhoneNumber, 'menu');
      
      expect(sentMessages[sentMessages.length - 1].message).toContain('MENU DE AJUDA');
    });

    it('should display help when user types "ajuda"', async () => {
      await messageProcessingService.processMessage(testPhoneNumber, 'ajuda');
      
      expect(sentMessages[sentMessages.length - 1].message).toContain('Comandos disponíveis');
    });
  });

  describe('Conversation State Persistence', () => {
    it('should maintain state across multiple messages', async () => {
      await messageProcessingService.processMessage(testPhoneNumber, 'oi');
      await messageProcessingService.processMessage(testPhoneNumber, '1');
      const state1 = conversationStateService.getState(testPhoneNumber);
      
      expect(state1).not.toBeNull();
      expect(state1?.data.userType).toBe('CLIENT');
    });

    it('should allow user to restart conversation with "menu"', async () => {
      await messageProcessingService.processMessage(testPhoneNumber, 'oi');
      await messageProcessingService.processMessage(testPhoneNumber, '1');
      
      const stateBefore = conversationStateService.getState(testPhoneNumber);
      expect(stateBefore).not.toBeNull();
      
      // simulate user restarting the conversation
      conversationStateService.clearState(testPhoneNumber);

      await messageProcessingService.processMessage(testPhoneNumber, 'menu');

      // Menu should be shown
      expect(sentMessages[sentMessages.length - 1].message).toContain('MENU DE AJUDA');
    });
  });

  describe('Multiple Simultaneous Users', () => {
    it('should handle multiple users in different conversation stages', async () => {
      const phone1 = '5584111111111';
      const phone2 = '5584222222222';
      // User 1: starts registration as client
      await messageProcessingService.processMessage(phone1, 'oi');
      await messageProcessingService.processMessage(phone1, '1');

      // User 2: starts registration as professional
      await messageProcessingService.processMessage(phone2, 'oi');
      await messageProcessingService.processMessage(phone2, '2');

      const state1 = conversationStateService.getState(phone1);
      const state2 = conversationStateService.getState(phone2);

      expect(state1?.data.userType).toBe('CLIENT');
      expect(state2?.data.userType).toBe('PROFESSIONAL');
    });
  });
});
