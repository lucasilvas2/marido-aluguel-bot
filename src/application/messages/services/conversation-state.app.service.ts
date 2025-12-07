import { Injectable } from '@nestjs/common';

interface ConversationState {
  userId: string;
  state: string;
  data?: any;
}

@Injectable()
export class ConversationStateAppService {
  private states: Map<string, ConversationState> = new Map();

  setState(userId: string, state: string, data?: any): void {
    this.states.set(userId, { userId, state, data });
  }

  getState(userId: string): ConversationState | undefined {
    return this.states.get(userId);
  }

  clearState(userId: string): void {
    this.states.delete(userId);
  }
}