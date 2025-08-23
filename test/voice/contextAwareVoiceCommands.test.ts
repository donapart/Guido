/**
 * Test suite for ContextAwareVoiceCommands
 */

import { ContextAwareVoiceCommands } from '../../src/voice/contextAwareVoiceCommands';
import { mockVSCode } from '../setup';
import * as vscode from 'vscode';

// Mock the vscode module
jest.mock('vscode', () => mockVSCode);

describe('ContextAwareVoiceCommands', () => {
  let voiceCommands: ContextAwareVoiceCommands;
  let mockModelRouter: any;
  let mockVoiceController: any;

  beforeEach(() => {
    mockModelRouter = {
      routePrompt: jest.fn().mockResolvedValue({
        content: 'Mock response',
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        cost: 0.001
      })
    };

    mockVoiceController = {
      speak: jest.fn(),
      isListening: false
    };

    voiceCommands = new ContextAwareVoiceCommands(mockModelRouter, mockVoiceController);
  });

  describe('constructor', () => {
    test('should create instance with dependencies', () => {
      expect(voiceCommands).toBeInstanceOf(ContextAwareVoiceCommands);
    });
  });

  describe('processCommand', () => {
    beforeEach(() => {
      // Mock active text editor
      mockVSCode.window.activeTextEditor = {
        document: {
          getText: jest.fn().mockReturnValue('const example = "test";'),
          languageId: 'typescript'
        },
        selection: {
          isEmpty: false,
          start: { line: 0, character: 0 },
          end: { line: 0, character: 20 }
        }
      };
    });

    test('should process explain command with selection', async () => {
      const command = 'erkläre diesen Code';
      await voiceCommands.processCommand(command);

      expect(mockModelRouter.routePrompt).toHaveBeenCalledWith(
        expect.stringContaining('Erkläre den folgenden TypeScript-Code'),
        expect.objectContaining({
          mode: 'quality',
          context: expect.objectContaining({
            hasSelection: true,
            language: 'typescript'
          })
        })
      );
    });

    test('should process test generation command', async () => {
      const command = 'generiere Tests für diesen Code';
      await voiceCommands.processCommand(command);

      expect(mockModelRouter.routePrompt).toHaveBeenCalledWith(
        expect.stringContaining('Generiere umfassende Unit-Tests'),
        expect.objectContaining({
          mode: 'quality'
        })
      );
    });

    test('should process refactor command', async () => {
      const command = 'refaktoriere diesen Code';
      await voiceCommands.processCommand(command);

      expect(mockModelRouter.routePrompt).toHaveBeenCalledWith(
        expect.stringContaining('Refaktoriere den folgenden Code'),
        expect.objectContaining({
          mode: 'quality'
        })
      );
    });

    test('should process documentation command', async () => {
      const command = 'dokumentiere diese Funktion';
      await voiceCommands.processCommand(command);

      expect(mockModelRouter.routePrompt).toHaveBeenCalledWith(
        expect.stringContaining('Erstelle eine umfassende Dokumentation'),
        expect.objectContaining({
          mode: 'quality'
        })
      );
    });

    test('should process optimization command', async () => {
      const command = 'optimiere diesen Code';
      await voiceCommands.processCommand(command);

      expect(mockModelRouter.routePrompt).toHaveBeenCalledWith(
        expect.stringContaining('Analysiere und optimiere den folgenden Code'),
        expect.objectContaining({
          mode: 'quality'
        })
      );
    });

    test('should handle custom commands', async () => {
      const customCommands = new Map([
        ['custom test', 'This is a custom command for {selection}']
      ]);
      voiceCommands.loadCustomCommands(customCommands);

      const command = 'custom test';
      await voiceCommands.processCommand(command);

      expect(mockModelRouter.routePrompt).toHaveBeenCalledWith(
        expect.stringContaining('This is a custom command'),
        expect.any(Object)
      );
    });

    test('should handle unknown commands', async () => {
      const command = 'unknown command';
      await voiceCommands.processCommand(command);

      expect(mockVoiceController.speak).toHaveBeenCalledWith(
        'Entschuldigung, ich verstehe diesen Befehl nicht.'
      );
    });

    test('should handle no active editor', async () => {
      mockVSCode.window.activeTextEditor = undefined;
      
      const command = 'erkläre diesen Code';
      await voiceCommands.processCommand(command);

      expect(mockVoiceController.speak).toHaveBeenCalledWith(
        'Kein aktiver Editor gefunden. Öffnen Sie eine Datei.'
      );
    });
  });

  describe('extractContext', () => {
    test('should extract context with selection', () => {
      const mockEditor = {
        document: {
          getText: jest.fn().mockReturnValue('const example = "test";'),
          languageId: 'typescript'
        },
        selection: {
          isEmpty: false,
          start: { line: 0, character: 0 },
          end: { line: 0, character: 20 }
        }
      };

      const context = (voiceCommands as any).extractContext(mockEditor);

      expect(context).toEqual({
        hasSelection: true,
        selectedText: 'const example = "test";',
        language: 'typescript',
        fileContent: 'const example = "test";',
        fileName: undefined,
        cursorPosition: { line: 0, character: 0 }
      });
    });

    test('should extract context without selection', () => {
      const mockEditor = {
        document: {
          getText: jest.fn().mockReturnValue('const example = "test";'),
          languageId: 'javascript',
          fileName: 'test.js'
        },
        selection: {
          isEmpty: true,
          start: { line: 1, character: 5 },
          end: { line: 1, character: 5 }
        }
      };

      const context = (voiceCommands as any).extractContext(mockEditor);

      expect(context).toEqual({
        hasSelection: false,
        selectedText: '',
        language: 'javascript',
        fileContent: 'const example = "test";',
        fileName: 'test.js',
        cursorPosition: { line: 1, character: 5 }
      });
    });
  });

  describe('matchCommand', () => {
    test('should match explain patterns', () => {
      const commands = [
        'erkläre diesen Code',
        'was macht dieser Code',
        'erklärung für diesen Code',
        'Code erklären'
      ];

      commands.forEach(command => {
        const match = (voiceCommands as any).matchCommand(command);
        expect(match?.type).toBe('explain');
      });
    });

    test('should match test generation patterns', () => {
      const commands = [
        'generiere Tests',
        'erstelle Tests für diesen Code',
        'Test schreiben',
        'Unit Tests generieren'
      ];

      commands.forEach(command => {
        const match = (voiceCommands as any).matchCommand(command);
        expect(match?.type).toBe('test');
      });
    });

    test('should match refactor patterns', () => {
      const commands = [
        'refaktoriere diesen Code',
        'Code refaktorieren',
        'verbessere den Code',
        'refactor this'
      ];

      commands.forEach(command => {
        const match = (voiceCommands as any).matchCommand(command);
        expect(match?.type).toBe('refactor');
      });
    });

    test('should return null for unmatched commands', () => {
      const command = 'totally unknown command';
      const match = (voiceCommands as any).matchCommand(command);
      expect(match).toBeNull();
    });
  });

  describe('buildPrompt', () => {
    test('should build explain prompt with context', () => {
      const context = {
        hasSelection: true,
        selectedText: 'const x = 5;',
        language: 'javascript',
        fileContent: 'const x = 5;\nconsole.log(x);',
        fileName: 'test.js',
        cursorPosition: { line: 0, character: 0 }
      };

      const prompt = (voiceCommands as any).buildPrompt('explain', context);

      expect(prompt).toContain('Erkläre den folgenden JavaScript-Code');
      expect(prompt).toContain('const x = 5;');
      expect(prompt).toContain('Kontext der gesamten Datei');
    });

    test('should build test prompt with context', () => {
      const context = {
        hasSelection: true,
        selectedText: 'function add(a, b) { return a + b; }',
        language: 'javascript',
        fileContent: 'function add(a, b) { return a + b; }',
        fileName: 'math.js',
        cursorPosition: { line: 0, character: 0 }
      };

      const prompt = (voiceCommands as any).buildPrompt('test', context);

      expect(prompt).toContain('Generiere umfassende Unit-Tests');
      expect(prompt).toContain('function add(a, b) { return a + b; }');
      expect(prompt).toContain('Jest oder ähnliches Testing-Framework');
    });
  });

  describe('loadCustomCommands', () => {
    test('should load custom commands from map', () => {
      const customCommands = new Map([
        ['custom command', 'Custom prompt for {selection}'],
        ['another command', 'Another prompt']
      ]);

      voiceCommands.loadCustomCommands(customCommands);

      // Test that custom command is now recognized
      const command = 'custom command';
      const match = (voiceCommands as any).matchCommand(command);
      expect(match?.type).toBe('custom');
      expect(match?.template).toBe('Custom prompt for {selection}');
    });
  });

  describe('replaceVariables', () => {
    test('should replace selection variable', () => {
      const template = 'Analyze this code: {selection}';
      const context = {
        hasSelection: true,
        selectedText: 'const x = 5;',
        language: 'javascript',
        fileContent: '',
        fileName: '',
        cursorPosition: { line: 0, character: 0 }
      };

      const result = (voiceCommands as any).replaceVariables(template, context);
      expect(result).toBe('Analyze this code: const x = 5;');
    });

    test('should replace language variable', () => {
      const template = 'This is {language} code';
      const context = {
        hasSelection: false,
        selectedText: '',
        language: 'typescript',
        fileContent: '',
        fileName: '',
        cursorPosition: { line: 0, character: 0 }
      };

      const result = (voiceCommands as any).replaceVariables(template, context);
      expect(result).toBe('This is typescript code');
    });

    test('should replace filename variable', () => {
      const template = 'Working with {filename}';
      const context = {
        hasSelection: false,
        selectedText: '',
        language: 'javascript',
        fileContent: '',
        fileName: 'test.js',
        cursorPosition: { line: 0, character: 0 }
      };

      const result = (voiceCommands as any).replaceVariables(template, context);
      expect(result).toBe('Working with test.js');
    });
  });

  describe('error handling', () => {
    test('should handle router errors gracefully', async () => {
      mockModelRouter.routePrompt.mockRejectedValue(new Error('Router error'));
      
      const command = 'erkläre diesen Code';
      await voiceCommands.processCommand(command);

      expect(mockVoiceController.speak).toHaveBeenCalledWith(
        'Entschuldigung, es ist ein Fehler aufgetreten.'
      );
    });

    test('should handle missing context gracefully', async () => {
      mockVSCode.window.activeTextEditor = {
        document: {
          getText: jest.fn().mockReturnValue(''),
          languageId: 'plaintext'
        },
        selection: {
          isEmpty: true,
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 }
        }
      };

      const command = 'erkläre diesen Code';
      await voiceCommands.processCommand(command);

      expect(mockVoiceController.speak).toHaveBeenCalledWith(
        'Keine Auswahl oder kein Code gefunden.'
      );
    });
  });
});
