import { Test, TestingModule } from '@nestjs/testing';
import { MessageProcessingService } from '../src/application/messages/services/message-processing.app.service';
import { ConversationStateService } from '../src/application/messages/services/conversation-state.app.service';
import { UserRegistrationService } from '../src/application/users/services/user-registration.service';
import { WhatsappWebService } from '../src/infraestructure/whatsappWeb/whatsappWeb.service';

describe('MessageProcessingService', () => {
  let service: MessageProcessingService;
  let conversationStateService: ConversationStateService;
  let userRegistrationService: UserRegistrationService;
  let whatsappService: WhatsappWebService;

  // Mock data
  const testPhoneNumber = '5584987654321';
  const testUser = {
    name: 'João Silva',
    email: 'joao@example.com',
    phone: testPhoneNumber,
    userType: 'CLIENT',
  };

  // Helper function to send message
  const sendMessage = (body: string) => {
    return service.processMessage({
      from: `${testPhoneNumber}@c.us`,
      body,
      timestamp: Date.now()
    });
  };

  beforeEach(async () => {
    // Create mocks
    const mockWhatsappService = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      getConnectionStatus: jest.fn().mockResolvedValue('connected'),
    };

    const mockUserRegistrationService = {
      registerUser: jest.fn().mockResolvedValue({
        user: testUser,
        address: {},
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageProcessingService,
        ConversationStateService,
        {
          provide: UserRegistrationService,
          useValue: mockUserRegistrationService,
        },
        {
          provide: WhatsappWebService,
          useValue: mockWhatsappService,
        },
      ],
    }).compile();

    service = module.get<MessageProcessingService>(MessageProcessingService);
    conversationStateService = module.get<ConversationStateService>(ConversationStateService);
    userRegistrationService = module.get<UserRegistrationService>(UserRegistrationService);
    whatsappService = module.get<WhatsappWebService>(WhatsappWebService);
  });

  afterEach(() => {
    // Limpar estado após cada teste
    jest.clearAllMocks();
  });

  describe('Initial Greeting', () => {
    it('should respond to "oi" with welcome message', async () => {
      await service.processMessage({ 
        from: `${testPhoneNumber}@c.us`, 
        body: "oi",
        timestamp: Date.now()
      });

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('👋 Olá!'),
      );
    });

    it('should respond to "menu" with menu options', async () => {
      await service.processMessage({ 
        from: `${testPhoneNumber}@c.us`, 
        body: 'menu',
        timestamp: Date.now()
      });

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('📋 MENU DE AJUDA'),
      );
    });

    it('should respond to "ajuda" with help message', async () => {
      await service.processMessage({ 
        from: `${testPhoneNumber}@c.us`, 
        body: 'ajuda',
        timestamp: Date.now()
      });

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('📋 MENU DE AJUDA'),
      );
    });
  });

  describe('User Type Selection', () => {
    beforeEach(async () => {
      // Simula que o usuário já iniciou o processo
      await sendMessage('1'); // Cadastro
    });

    it('should set user type as CLIENT when selecting option 1', async () => {
      await sendMessage('1');

      const state = conversationStateService.getState(testPhoneNumber);
      expect(state?.data?.userType).toBe('CLIENT');
      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('cliente'),
      );
    });

    it('should set user type as PROFESSIONAL when selecting option 2', async () => {
      await sendMessage('2');

      const state = conversationStateService.getState(testPhoneNumber);
      expect(state?.data?.userType).toBe('PROFESSIONAL');
      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('profissional'),
      );
    });
  });

  describe('User Information Collection', () => {
    beforeEach(async () => {
      // Setup: usuário escolheu ser cliente
      conversationStateService.setState(testPhoneNumber, 'waiting_user_info', {
        userType: 'CLIENT',
      });
    });

    it('should collect and validate user name', async () => {
      await sendMessage('João Silva');

      const state = conversationStateService.getState(testPhoneNumber);
      expect(state?.data?.name).toBe('João Silva');
      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('email'),
      );
    });

    it('should validate email format', async () => {
      conversationStateService.setState(testPhoneNumber, 'waiting_user_info', {
        userType: 'CLIENT',
        name: 'João Silva',
      });

      await sendMessage('email-invalido');

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('❌ Email inválido'),
      );
    });

    it('should accept valid email', async () => {
      conversationStateService.setState(testPhoneNumber, 'waiting_user_info', {
        userType: 'CLIENT',
        name: 'João Silva',
      });

      await sendMessage('joao@example.com');

      const state = conversationStateService.getState(testPhoneNumber);
      expect(state?.data?.email).toBe('joao@example.com');
    });
  });

  describe('Address Information Collection', () => {
    beforeEach(async () => {
      conversationStateService.setState(testPhoneNumber, 'waiting_address', {
        userType: 'CLIENT',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: testPhoneNumber,
      });
    });

    it('should validate CEP format', async () => {
      await sendMessage('123'); // CEP inválido

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('❌ CEP inválido. Por favor, informe um CEP válido com 8 dígitos:'),
      );
    });

    it('should accept valid CEP', async () => {
      await sendMessage('59000000');

      const state = conversationStateService.getState(testPhoneNumber);
      expect(state?.data?.address?.postalCode).toBe('59000000');
    });

    it('should validate state format (UF)', async () => {
      // Preenche todos os campos anteriores para que a próxima entrada seja o estado
      conversationStateService.setState(testPhoneNumber, 'waiting_address', {
        userType: 'CLIENT',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: testPhoneNumber,
        address: {
          postalCode: '59000000',
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Petrópolis',
          city: 'Natal'
        },
      });

      await sendMessage('RNX'); // Estado inválido

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('❌ Estado inválido. Por favor, informe a sigla do estado (ex: SP, RJ):'),
      );
    });

    it('should accept valid state (UF)', async () => {
      // Preenche todos os campos anteriores para que a próxima entrada seja o estado
      conversationStateService.setState(testPhoneNumber, 'waiting_address', {
        userType: 'CLIENT',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: testPhoneNumber,
        address: {
          postalCode: '59000000',
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Petrópolis',
          city: 'Natal'
        },
      });

      await sendMessage('RN');

      // registerUser is called and conversation state is cleared after successful registration
      expect(userRegistrationService.registerUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João Silva',
          email: 'joao@example.com',
          phone: testPhoneNumber,
          userType: 'CLIENT',
        }),
        expect.objectContaining({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Petrópolis',
          city: 'Natal',
          state: 'RN',
          postalCode: '59000000',
        }),
      );

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('Cadastro realizado com sucesso'),
      );
    });
  });

  describe('Complete Registration Flow', () => {
    it('should complete full registration flow for CLIENT', async () => {
      // Step 1: Greeting
      await sendMessage('oi');
      
      // Choose client type (single selection after welcome)
      await sendMessage('1');
      
      // Step 4: Provide name
      await sendMessage('João Silva');
      
      // Step 5: Provide email
      await sendMessage('joao@example.com');
      
      // Step 6: Provide CEP
      await sendMessage('59000000');

      // Step 7: Provide street
      await sendMessage('Rua das Flores');

      // Step 8: Provide number
      await sendMessage('123');

      // Step 9: Provide neighborhood
      await sendMessage('Petrópolis');

      // Step 10: Provide city
      await sendMessage('Natal');

      // Step 11: Provide state
      await sendMessage('RN');

      // Verify registration was called
      expect(userRegistrationService.registerUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João Silva',
          email: 'joao@example.com',
          phone: testPhoneNumber,
          userType: 'CLIENT',
        }),
        expect.objectContaining({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Petrópolis',
          city: 'Natal',
          state: 'RN',
          postalCode: '59000000',
        }),
      );

      // Verify success message
      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('Cadastro realizado com sucesso'),
      );
    });

    it('should complete full registration flow for PROFESSIONAL', async () => {
      // Similar flow but choosing PROFESSIONAL option
      await sendMessage('oi');
      // Choose professional directly
      await sendMessage('2');
      await sendMessage('Maria Santos');
      await sendMessage('maria@example.com');
      await sendMessage('59000000');

      // street -> number -> neighborhood -> city -> state
      await sendMessage('Av. Senador Salgado Filho');
      await sendMessage('456');
      await sendMessage('Centro');
      await sendMessage('Natal');
      await sendMessage('RN');

      expect(userRegistrationService.registerUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Maria Santos',
          userType: 'PROFESSIONAL',
        }),
        expect.any(Object),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle registration errors gracefully', async () => {
      // Mock registration error and simulate final address step triggering registration
      jest.spyOn(userRegistrationService, 'registerUser').mockRejectedValueOnce(
        new Error('Database error'),
      );

      // Prepare conversation so next input will be the state and trigger registration
      conversationStateService.setState(testPhoneNumber, 'waiting_address', {
        userType: 'CLIENT',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: testPhoneNumber,
        address: {
          postalCode: '59000000',
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Petrópolis',
          city: 'Natal'
        },
      });

      // Send invalid state to trigger validation path (we want the valid state to call register and fail)
      await sendMessage('RN');

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('❌ Ocorreu um erro ao realizar seu cadastro'),
      );
    });

    it('should handle unknown commands', async () => {
      await sendMessage('comando inexistente');

      // When there is no conversation state, unknown commands trigger the welcome message
      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        `${testPhoneNumber}@c.us`,
        expect.stringContaining('👋 Olá!'),
      );
    });
  });

  describe('State Management', () => {
    it('should maintain conversation state between messages', async () => {
      await sendMessage('1');
      const state1 = conversationStateService.getState(testPhoneNumber);
      
      await sendMessage('1');
      const state2 = conversationStateService.getState(testPhoneNumber);

      expect(state1?.state).not.toBe(state2?.state);
      expect(state2?.data?.userType).toBe('CLIENT');
    });

    it('should clear state after successful registration', async () => {
      conversationStateService.setState(testPhoneNumber, 'confirming_registration', {
        userType: 'CLIENT',
        name: 'João Silva',
        email: 'joao@example.com',
        phone: testPhoneNumber,
        address: {
          postalCode: '59000000',
          state: 'RN',
          city: 'Natal',
          neighborhood: 'Petrópolis',
          street: 'Rua das Flores',
          number: '123',
        },
      });

      await sendMessage('sim');

      const state = conversationStateService.getState(testPhoneNumber);
      expect(state).toBeUndefined();
    });
  });
});


