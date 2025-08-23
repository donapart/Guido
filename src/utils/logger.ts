import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class GuidoLogger {
  private initialized = false;
  private logDir = '';
  private output: vscode.OutputChannel | null = null;

  init(context: vscode.ExtensionContext) {
    if (this.initialized) return;

    const storagePath = context.globalStorageUri?.fsPath
      || path.join(context.extensionUri.fsPath, '.storage');

    this.logDir = path.join(storagePath, 'logs');
    try {
      fs.mkdirSync(this.logDir, { recursive: true });
    } catch {}

    this.output = vscode.window.createOutputChannel('Guido Model Router');

    // Hook unhandled errors
    process.on('uncaughtException', (err) => {
      this.error('uncaughtException', { message: err.message, stack: err.stack });
    });
    process.on('unhandledRejection', (reason: any) => {
      this.error('unhandledRejection', { reason: String(reason) });
    });

    this.initialized = true;
  }

  getLatestLogFile(): string {
    const file = `guido-${this.today()}.log`;
    return path.join(this.logDir, file);
  }

  async showLatestLog(): Promise<void> {
    const file = this.getLatestLogFile();
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '', 'utf8');
    }
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  clearLogs(): void {
    try {
      if (!fs.existsSync(this.logDir)) return;
      const files = fs.readdirSync(this.logDir);
      for (const f of files) {
        try { fs.unlinkSync(path.join(this.logDir, f)); } catch {}
      }
    } catch {}
  }

  debug(message: string, data?: unknown) { this.write('debug', message, data); }
  info(message: string, data?: unknown) { this.write('info', message, data); }
  warn(message: string, data?: unknown) { this.write('warn', message, data); }
  error(message: string, data?: unknown) { this.write('error', message, data); }

  private write(level: LogLevel, message: string, data?: unknown) {
    try {
      const record = {
        ts: new Date().toISOString(),
        level,
        message,
        data
      };

      const line = JSON.stringify(record) + '\n';
      const file = this.getLatestLogFile();
      fs.appendFileSync(file, line, { encoding: 'utf8' });

      if (this.output) {
        const prefix = level.toUpperCase().padEnd(5);
        this.output.appendLine(`${prefix} ${message}${data ? ' ' + this.safeString(data) : ''}`);
      }
    } catch {}
  }

  private today(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  private safeString(obj: unknown): string {
    try { return JSON.stringify(obj); } catch { return String(obj); }
  }
}

export const logger = new GuidoLogger();
