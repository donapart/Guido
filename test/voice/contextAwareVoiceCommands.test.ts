// @ts-nocheck
/**
 * Minimal tests for ContextAwareVoiceCommands
 */

import { ContextAwareVoiceCommands } from '../../src/voice/contextAwareVoiceCommands';
import mockVSCode from '../setup';

describe('ContextAwareVoiceCommands', () => {
  let voiceCommands: ContextAwareVoiceCommands;
  let mockModelRouter: any;
  let mockVoiceController: any;

  beforeEach(() => {
    mockModelRouter = {
      route: jest.fn().mockResolvedValue({ content: 'Mock response' })
    };

    mockVoiceController = {
      speak: jest.fn(),
      isListening: false
    };

    voiceCommands = new ContextAwareVoiceCommands(
      mockModelRouter as any,
      mockVoiceController as any
    );
  });

  describe('processVoiceCommand', () => {
    beforeEach(() => {
      mockVSCode.window.activeTextEditor = {
        document: {
          getText: jest.fn().mockReturnValue('const example = "test";'),
          languageId: 'typescript',
          fileName: 'test.ts',
          uri: { fsPath: '/workspace/test.ts' }
        },
        selection: {
          isEmpty: false,
          start: { line: 0, character: 0 },
          end: { line: 0, character: 20 },
          active: { line: 0, character: 20 }
        }
      } as any;
      mockVSCode.workspace.getWorkspaceFolder.mockReturnValue({ uri: { fsPath: '/workspace' } });
    });

    test('processes explain command with selection', async () => {
      const handled = await voiceCommands.processVoiceCommand('guido erkläre diesen Code');
      expect(handled).toBe(true);
      expect(mockModelRouter.route).toHaveBeenCalled();
    });

    test('handles custom commands', async () => {
      const customCommands = [
        {
          phrase: 'custom test',
          command: 'This is a custom command for ${selection}',
          type: 'router'
        }
      ];
      voiceCommands.loadCustomCommands(customCommands);

      const handled = await voiceCommands.processVoiceCommand('guido custom test');
      expect(handled).toBe(true);
      expect(mockModelRouter.route).toHaveBeenCalled();
    });

    test('handles unknown commands', async () => {
      const handled = await voiceCommands.processVoiceCommand('guido unknown command');
      expect(handled).toBe(false);
      expect(mockModelRouter.route).not.toHaveBeenCalled();
    });

    test('handles no active editor', async () => {
      mockVSCode.window.activeTextEditor = undefined;
      await voiceCommands.processVoiceCommand('guido erkläre diesen Code');
      expect(mockVSCode.window.showWarningMessage).toHaveBeenCalled();
    });
  });
});
