/**
 * Permission Manager for Guido Voice Control
 * Handles security, permissions, and access control for voice commands
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export interface PermissionConfig {
  allowSystemCommands: boolean;
  allowFileOperations: boolean;
  allowTerminalAccess: boolean;
  allowNetworkRequests: boolean;
  allowExtensionControl: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'paranoid';
  requireConfirmationFor: string[];
  auditLog: boolean;
  auditLogPath: string;
  maxAuditEntries: number;
}

export interface PermissionRequest {
  action: string;
  resource?: string;
  parameters?: any;
  timestamp: Date;
  userInput: string;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  resource?: string;
  allowed: boolean;
  reason: string;
  userInput: string;
  securityLevel: string;
}

export interface SecurityContext {
  currentUser: string;
  workspaceFolder?: string;
  activeFiles: string[];
  recentActions: string[];
  trustLevel: 'untrusted' | 'basic' | 'trusted' | 'admin';
}

export class PermissionManager {
  private auditLog: AuditEntry[] = [];
  private securityContext: SecurityContext;
  private trustedDomains: Set<string> = new Set();
  private blockedActions: Set<string> = new Set();
  private temporaryPermissions: Map<string, { expiry: Date; scope: string }> = new Map();

  constructor(private config: PermissionConfig) {
    this.securityContext = this.initializeSecurityContext();
    this.loadAuditLog();
    this.initializeSecurityPolicies();
  }

  async checkPermission(request: PermissionRequest): Promise<{
    allowed: boolean;
    reason: string;
    requiresConfirmation?: boolean;
    confirmationMessage?: string;
  }> {
    const { action, resource, parameters, userInput } = request;

    // Log the permission request
    this.logAuditEntry({
      timestamp: new Date(),
      action,
      resource,
      allowed: false, // Will be updated after decision
      reason: 'Checking permission',
      userInput,
      securityLevel: this.config.securityLevel
    });

    try {
      // 1. Check if action is explicitly blocked
      if (this.blockedActions.has(action)) {
        return this.denyPermission(action, 'Action is explicitly blocked');
      }

      // 2. Check basic permissions based on configuration
      const basicCheck = this.checkBasicPermissions(action);
      if (!basicCheck.allowed) {
        return basicCheck;
      }

      // 3. Check security level restrictions
      const securityCheck = this.checkSecurityLevel(action, resource, parameters);
      if (!securityCheck.allowed) {
        return securityCheck;
      }

      // 4. Check if confirmation is required
      const confirmationCheck = this.checkConfirmationRequirement(action, resource);
      if (confirmationCheck.requiresConfirmation) {
        return confirmationCheck;
      }

      // 5. Check resource-specific permissions
      const resourceCheck = await this.checkResourcePermissions(action, resource, parameters);
      if (!resourceCheck.allowed) {
        return resourceCheck;
      }

      // 6. Final security validation
      const finalCheck = await this.performFinalSecurityCheck(request);
      if (!finalCheck.allowed) {
        return finalCheck;
      }

      // Permission granted
      return this.grantPermission(action, 'All security checks passed');

    } catch (error) {
      return this.denyPermission(action, `Security check failed: ${error.message}`);
    }
  }

  private checkBasicPermissions(action: string): { allowed: boolean; reason: string } {
    const actionCategories = {
      system: ['switchMode', 'showBudget', 'testProviders', 'openConfig'],
      file: ['openFile', 'saveFile', 'deleteFile', 'createFile'],
      terminal: ['openTerminal', 'executeCommand', 'runScript'],
      network: ['httpRequest', 'apiCall', 'download', 'upload'],
      extension: ['installExtension', 'enableExtension', 'disableExtension'],
      voice: ['changeVoice', 'changeVolume', 'changeSpeed'],
      content: ['explainCode', 'optimizeCode', 'writeTests', 'generateDocs', 'refactorCode'],
      navigation: ['showProblems', 'globalSearch']
    };

    // Check system commands
    if (actionCategories.system.includes(action) && !this.config.allowSystemCommands) {
      return this.denyPermission(action, 'System commands are disabled');
    }

    // Check file operations
    if (actionCategories.file.includes(action) && !this.config.allowFileOperations) {
      return this.denyPermission(action, 'File operations are disabled');
    }

    // Check terminal access
    if (actionCategories.terminal.includes(action) && !this.config.allowTerminalAccess) {
      return this.denyPermission(action, 'Terminal access is disabled');
    }

    // Check network requests
    if (actionCategories.network.includes(action) && !this.config.allowNetworkRequests) {
      return this.denyPermission(action, 'Network requests are disabled');
    }

    // Check extension control
    if (actionCategories.extension.includes(action) && !this.config.allowExtensionControl) {
      return this.denyPermission(action, 'Extension control is disabled');
    }

    return { allowed: true, reason: 'Basic permissions check passed' };
  }

  private checkSecurityLevel(action: string, resource?: string, parameters?: any): { allowed: boolean; reason: string } {
    const securityLevel = this.config.securityLevel;
    
    // Define risk levels for different actions
    const riskLevels = {
      low: ['changeVoice', 'changeVolume', 'showBudget', 'explainCode'],
      medium: ['openFile', 'globalSearch', 'optimizeCode', 'writeTests'],
      high: ['openTerminal', 'executeCommand', 'refactorCode', 'deleteFile'],
      critical: ['installExtension', 'runScript', 'systemCommand']
    };

    switch (securityLevel) {
      case 'low':
        // Allow everything except critical
        if (riskLevels.critical.includes(action)) {
          return this.denyPermission(action, 'Action too risky for low security level');
        }
        break;

      case 'medium':
        // Allow low and medium risk actions
        if (riskLevels.high.includes(action) || riskLevels.critical.includes(action)) {
          return this.denyPermission(action, 'Action too risky for medium security level');
        }
        break;

      case 'high':
        // Allow low, medium, and some high risk actions
        if (riskLevels.critical.includes(action)) {
          return this.denyPermission(action, 'Critical actions disabled in high security mode');
        }
        // High risk actions require additional validation
        if (riskLevels.high.includes(action)) {
          return { 
            allowed: false, 
            reason: 'High risk action requires confirmation',
            requiresConfirmation: true,
            confirmationMessage: `Diese Aktion (${action}) ist riskant. Wirklich ausführen?`
          };
        }
        break;

      case 'paranoid':
        // Only allow very safe actions
        if (!riskLevels.low.includes(action)) {
          return this.denyPermission(action, 'Only low-risk actions allowed in paranoid mode');
        }
        break;
    }

    return { allowed: true, reason: 'Security level check passed' };
  }

  private checkConfirmationRequirement(action: string, resource?: string): {
    allowed: boolean;
    reason: string;
    requiresConfirmation?: boolean;
    confirmationMessage?: string;
  } {
    const requiresConfirmation = this.config.requireConfirmationFor.some(pattern => {
      if (pattern === action) return true;
      if (pattern.includes('*') && action.includes(pattern.replace('*', ''))) return true;
      return false;
    });

    if (requiresConfirmation) {
      return {
        allowed: false,
        reason: 'Action requires user confirmation',
        requiresConfirmation: true,
        confirmationMessage: `Möchten Sie wirklich ${action} ausführen${resource ? ` für ${resource}` : ''}?`
      };
    }

    return { allowed: true, reason: 'No confirmation required' };
  }

  private async checkResourcePermissions(action: string, resource?: string, parameters?: any): Promise<{
    allowed: boolean;
    reason: string;
  }> {
    if (!resource) {
      return { allowed: true, reason: 'No resource specified' };
    }

    // Check file path restrictions
    if (action.includes('file') || action.includes('File')) {
      return this.checkFilePermissions(action, resource);
    }

    // Check network resource restrictions
    if (action.includes('network') || action.includes('http')) {
      return this.checkNetworkPermissions(action, resource);
    }

    // Check extension permissions
    if (action.includes('extension') || action.includes('Extension')) {
      return this.checkExtensionPermissions(action, resource);
    }

    return { allowed: true, reason: 'Resource permissions check passed' };
  }

  private checkFilePermissions(action: string, filePath: string): { allowed: boolean; reason: string } {
    // Check if file is in workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder && !filePath.startsWith(workspaceFolder.uri.fsPath)) {
      if (this.config.securityLevel === 'high' || this.config.securityLevel === 'paranoid') {
        return this.denyPermission(action, 'File outside workspace not allowed in high security mode');
      }
    }

    // Check for sensitive file patterns
    const sensitivePatterns = [
      /\.env/i,
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /config\.json$/i,
      /\.pem$/i,
      /\.key$/i
    ];

    if (sensitivePatterns.some(pattern => pattern.test(filePath))) {
      return this.denyPermission(action, 'Access to sensitive files requires higher privileges');
    }

    // Check file extension restrictions
    const restrictedExtensions = ['.exe', '.bat', '.sh', '.ps1', '.cmd'];
    const fileExtension = path.extname(filePath).toLowerCase();
    
    if (restrictedExtensions.includes(fileExtension) && action.includes('execute')) {
      return this.denyPermission(action, 'Execution of executable files is restricted');
    }

    return { allowed: true, reason: 'File permissions check passed' };
  }

  private checkNetworkPermissions(action: string, url: string): { allowed: boolean; reason: string } {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check trusted domains
      if (this.trustedDomains.has(domain)) {
        return { allowed: true, reason: 'Domain is trusted' };
      }

      // Check for suspicious domains
      const suspiciousDomains = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        'file://'
      ];

      if (suspiciousDomains.some(suspicious => url.includes(suspicious))) {
        if (this.config.securityLevel === 'high' || this.config.securityLevel === 'paranoid') {
          return this.denyPermission(action, 'Local network access restricted in high security mode');
        }
      }

      // Check protocol
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        return this.denyPermission(action, 'Only HTTP/HTTPS protocols allowed');
      }

      return { allowed: true, reason: 'Network permissions check passed' };
    } catch (error) {
      return this.denyPermission(action, 'Invalid URL format');
    }
  }

  private checkExtensionPermissions(action: string, extensionId: string): { allowed: boolean; reason: string } {
    // Check for trusted extension publishers
    const trustedPublishers = ['microsoft', 'ms-vscode', 'ms-python', 'github'];
    const publisher = extensionId.split('.')[0];

    if (!trustedPublishers.includes(publisher)) {
      if (this.config.securityLevel === 'high' || this.config.securityLevel === 'paranoid') {
        return this.denyPermission(action, 'Only trusted publishers allowed in high security mode');
      }
    }

    return { allowed: true, reason: 'Extension permissions check passed' };
  }

  private async performFinalSecurityCheck(request: PermissionRequest): Promise<{
    allowed: boolean;
    reason: string;
  }> {
    // Check rate limiting
    if (await this.isRateLimited(request.action)) {
      return this.denyPermission(request.action, 'Rate limit exceeded');
    }

    // Check for suspicious patterns in user input
    if (this.containsSuspiciousContent(request.userInput)) {
      return this.denyPermission(request.action, 'Suspicious content detected in input');
    }

    // Check temporal permissions
    if (this.hasTemporaryPermission(request.action)) {
      return { allowed: true, reason: 'Temporary permission granted' };
    }

    return { allowed: true, reason: 'Final security check passed' };
  }

  private async isRateLimited(action: string): Promise<boolean> {
    // Simple rate limiting implementation
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    const recentActions = this.auditLog.filter(entry => 
      entry.action === action && 
      entry.timestamp > oneMinuteAgo &&
      entry.allowed
    );

    // Different limits based on action type
    const rateLimits: Record<string, number> = {
      'openFile': 10,
      'executeCommand': 5,
      'networkRequest': 20,
      'default': 15
    };

    const limit = rateLimits[action] || rateLimits.default;
    return recentActions.length >= limit;
  }

  private containsSuspiciousContent(input: string): boolean {
    const suspiciousPatterns = [
      /rm\s+-rf/i,
      /del\s+\/s/i,
      /format\s+c:/i,
      /DROP\s+TABLE/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /<script/i,
      /javascript:/i,
      /vbscript:/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  private hasTemporaryPermission(action: string): boolean {
    const permission = this.temporaryPermissions.get(action);
    if (!permission) return false;

    if (permission.expiry < new Date()) {
      this.temporaryPermissions.delete(action);
      return false;
    }

    return true;
  }

  private grantPermission(action: string, reason: string): {
    allowed: boolean;
    reason: string;
  } {
    this.updateAuditLog(action, true, reason);
    return { allowed: true, reason };
  }

  private denyPermission(action: string, reason: string): {
    allowed: boolean;
    reason: string;
  } {
    this.updateAuditLog(action, false, reason);
    return { allowed: false, reason };
  }

  private updateAuditLog(action: string, allowed: boolean, reason: string): void {
    if (this.auditLog.length > 0) {
      const lastEntry = this.auditLog[this.auditLog.length - 1];
      if (lastEntry.action === action && lastEntry.reason === 'Checking permission') {
        lastEntry.allowed = allowed;
        lastEntry.reason = reason;
      }
    }
    
    this.saveAuditLog();
  }

  private initializeSecurityContext(): SecurityContext {
    return {
      currentUser: process.env.USER || process.env.USERNAME || 'unknown',
      workspaceFolder: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      activeFiles: [],
      recentActions: [],
      trustLevel: 'basic'
    };
  }

  private initializeSecurityPolicies(): void {
    // Initialize trusted domains
    this.trustedDomains.add('api.openai.com');
    this.trustedDomains.add('api.deepseek.com');
    this.trustedDomains.add('api.x.ai');
    this.trustedDomains.add('marketplace.visualstudio.com');
    this.trustedDomains.add('github.com');

    // Initialize based on security level
    if (this.config.securityLevel === 'paranoid') {
      this.blockedActions.add('executeCommand');
      this.blockedActions.add('installExtension');
      this.blockedActions.add('deleteFile');
    }
  }

  private loadAuditLog(): void {
    if (!this.config.auditLog) return;

    try {
      const logPath = path.resolve(this.config.auditLogPath);
      if (fs.existsSync(logPath)) {
        const logData = fs.readFileSync(logPath, 'utf8');
        this.auditLog = JSON.parse(logData).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load audit log:', error);
    }
  }

  private saveAuditLog(): void {
    if (!this.config.auditLog) return;

    try {
      // Trim log if too large
      if (this.auditLog.length > this.config.maxAuditEntries) {
        this.auditLog = this.auditLog.slice(-this.config.maxAuditEntries);
      }

      const logPath = path.resolve(this.config.auditLogPath);
      const logDir = path.dirname(logPath);
      
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.writeFileSync(logPath, JSON.stringify(this.auditLog, null, 2));
    } catch (error) {
      console.warn('Failed to save audit log:', error);
    }
  }

  private logAuditEntry(entry: AuditEntry): void {
    if (this.config.auditLog) {
      this.auditLog.push(entry);
    }
  }

  // Public methods for permission management
  grantTemporaryPermission(action: string, durationMinutes: number, scope: string = 'session'): void {
    const expiry = new Date(Date.now() + durationMinutes * 60000);
    this.temporaryPermissions.set(action, { expiry, scope });
  }

  revokeTemporaryPermission(action: string): void {
    this.temporaryPermissions.delete(action);
  }

  addTrustedDomain(domain: string): void {
    this.trustedDomains.add(domain);
  }

  removeTrustedDomain(domain: string): void {
    this.trustedDomains.delete(domain);
  }

  blockAction(action: string): void {
    this.blockedActions.add(action);
  }

  unblockAction(action: string): void {
    this.blockedActions.delete(action);
  }

  getSecurityReport(): {
    securityLevel: string;
    auditEntries: number;
    recentDenials: AuditEntry[];
    trustedDomains: string[];
    blockedActions: string[];
    temporaryPermissions: string[];
  } {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentDenials = this.auditLog.filter(entry => 
      !entry.allowed && entry.timestamp > oneHourAgo
    ).slice(-10);

    return {
      securityLevel: this.config.securityLevel,
      auditEntries: this.auditLog.length,
      recentDenials,
      trustedDomains: Array.from(this.trustedDomains),
      blockedActions: Array.from(this.blockedActions),
      temporaryPermissions: Array.from(this.temporaryPermissions.keys())
    };
  }

  clearAuditLog(): void {
    this.auditLog = [];
    this.saveAuditLog();
  }

  exportAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  updateSecurityLevel(level: PermissionConfig['securityLevel']): void {
    this.config.securityLevel = level;
    this.initializeSecurityPolicies();
  }

  // Biometric authentication placeholder
  async authenticateUser(method: 'fingerprint' | 'face' | 'voice'): Promise<boolean> {
    // Placeholder for biometric authentication
    // In a real implementation, this would integrate with system biometric APIs
    console.log(`Biometric authentication requested: ${method}`);
    return false; // Not implemented
  }
}
