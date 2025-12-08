import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStateService } from '../src/application/messages/services/conversation-state.app.service';

describe('ConversationStateService', () => {
  let service: ConversationStateService;
  const testPhoneNumber = '5584987654321';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversationStateService],
    }).compile();

    service = module.get<ConversationStateService>(ConversationStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setState', () => {
    it('should set conversation state', () => {
      service.setState(testPhoneNumber, 'waiting_user_info', { userType: 'CLIENT' });
      
      const state = service.getState(testPhoneNumber);
      expect(state).toBeDefined();
      expect(state?.state).toBe('waiting_user_info');
      expect(state?.data.userType).toBe('CLIENT');
    });

    it('should update existing state', () => {
      service.setState(testPhoneNumber, 'waiting_user_info', { userType: 'CLIENT' });
      service.setState(testPhoneNumber, 'waiting_email', { 
        userType: 'CLIENT',
        name: 'João Silva'
      });
      
      const state = service.getState(testPhoneNumber);
      expect(state?.state).toBe('waiting_email');
      expect(state?.data.name).toBe('João Silva');
      expect(state?.data.userType).toBe('CLIENT');
    });
  });

  describe('getState', () => {
    it('should return undefined for non-existent state', () => {
      const state = service.getState('nonexistent');
      expect(state).toBeUndefined();
    });

    it('should return existing state', () => {
      service.setState(testPhoneNumber, 'waiting_user_info', {});
      const state = service.getState(testPhoneNumber);
      
      expect(state).toBeDefined();
      expect(state?.state).toBe('waiting_user_info');
    });
  });

  describe('clearState', () => {
    it('should clear conversation state', () => {
      service.setState(testPhoneNumber, 'waiting_user_info', { userType: 'CLIENT' });
      service.clearState(testPhoneNumber);
      
      const state = service.getState(testPhoneNumber);
      expect(state).toBeUndefined();
    });

    it('should handle clearing non-existent state', () => {
      expect(() => {
        service.clearState('nonexistent');
      }).not.toThrow();
    });
  });

  describe('Multiple users', () => {
    it('should maintain separate states for different users', () => {
      const phone1 = '5584111111111';
      const phone2 = '5584222222222';

      service.setState(phone1, 'waiting_user_info', { userType: 'CLIENT' });
      service.setState(phone2, 'waiting_email', { userType: 'PROFESSIONAL' });

      const state1 = service.getState(phone1);
      const state2 = service.getState(phone2);

      expect(state1?.state).toBe('waiting_user_info');
      expect(state1?.data.userType).toBe('CLIENT');
      
      expect(state2?.state).toBe('waiting_email');
      expect(state2?.data.userType).toBe('PROFESSIONAL');
    });
  });
});
