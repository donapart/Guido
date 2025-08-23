"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
class GuidoLogger {
    initialized = false;
    logDir = '';
    output = null;
    init(context) {
        if (this.initialized)
            return;
        const storagePath = context.globalStorageUri?.fsPath
            || path.join(context.extensionUri.fsPath, '.storage');
        this.logDir = path.join(storagePath, 'logs');
        try {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        catch { }
        this.output = vscode.window.createOutputChannel('Guido Model Router');
        // Hook unhandled errors
        process.on('uncaughtException', (err) => {
            this.error('uncaughtException', { message: err.message, stack: err.stack });
        });
        process.on('unhandledRejection', (reason) => {
            this.error('unhandledRejection', { reason: String(reason) });
        });
        this.initialized = true;
    }
    getLatestLogFile() {
        const file = `guido-${this.today()}.log`;
        return path.join(this.logDir, file);
    }
    async showLatestLog() {
        const file = this.getLatestLogFile();
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, '', 'utf8');
        }
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
        await vscode.window.showTextDocument(doc, { preview: false });
    }
    clearLogs() {
        try {
            if (!fs.existsSync(this.logDir))
                return;
            const files = fs.readdirSync(this.logDir);
            for (const f of files) {
                try {
                    fs.unlinkSync(path.join(this.logDir, f));
                }
                catch { }
            }
        }
        catch { }
    }
    debug(message, data) { this.write('debug', message, data); }
    info(message, data) { this.write('info', message, data); }
    warn(message, data) { this.write('warn', message, data); }
    error(message, data) { this.write('error', message, data); }
    write(level, message, data) {
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
        }
        catch { }
    }
    today() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}${m}${day}`;
    }
    safeString(obj) {
        try {
            return JSON.stringify(obj);
        }
        catch {
            return String(obj);
        }
    }
}
exports.logger = new GuidoLogger();
//# sourceMappingURL=logger.js.map