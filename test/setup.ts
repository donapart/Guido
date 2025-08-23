/**
 * Jest test setup file
 * Configures global test environment and mocks
 */

import { jest, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock VS Code API
export const mockVSCode = {
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    createWebviewPanel: jest.fn(),
    createOutputChannel: jest.fn(),
    activeTextEditor: undefined
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn(),
      has: jest.fn()
    })),
    workspaceFolders: [],
    getWorkspaceFolder: jest.fn()
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn()
  },
  ExtensionContext: jest.fn(),
  Uri: {
    file: jest.fn(),
    parse: jest.fn()
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Three: 3
  },
  WebviewPanelSerializer: jest.fn(),
  StatusBarAlignment: {
    Left: 1,
    Right: 2
  }
};

jest.mock('vscode', () => mockVSCode, { virtual: true });

// Global mocks
global.fetch = jest.fn() as any;
global.WebSocket = jest.fn() as any;

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  })),
  post: jest.fn(),
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

// Mock WebSpeech API
global.SpeechRecognition = jest.fn(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
})) as any;

global.webkitSpeechRecognition = global.SpeechRecognition;

// Setup test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsole = console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Export mock for use in tests
export default mockVSCode;
