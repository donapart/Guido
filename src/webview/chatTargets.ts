import { ChatPanel } from './chatPanel';
import { ChatDockViewProvider } from './chatDockView';

export interface ChatTarget {
  streamDelta(t: string): void;
  streamDone(meta?: any): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  showError(m: string): void;
  sendInfo(m: string): void;
  sendHistory(h: { role:'user'|'assistant'; content:string; meta?:any }[]): void; // eslint-disable-line @typescript-eslint/no-explicit-any
  addUserMessage(t: string): void;
  sendModels(models: string[]): void;
  sendVoiceState(state: string): void;
  sendMessage?(message: { type: string; data?: any }): void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function getActiveChatTargets(): ChatTarget[] {
  const targets: ChatTarget[] = [];
  if (ChatPanel.current) targets.push(ChatPanel.current as unknown as ChatTarget);
  if (ChatDockViewProvider.current) targets.push(ChatDockViewProvider.current as unknown as ChatTarget);
  return targets;
}
