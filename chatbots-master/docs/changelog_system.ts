import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { workspace } from 'vscode';

interface LogEntry {
  timestamp: string;
  sessionId: string;
  questionHash: string;
  answerHash: string;
  fileChanges: string[];
  codeModifications: CodeModification[];
  errorStates: ErrorState[];
  completionStatus: CompletionStatus;
  metadata: EntryMetadata;
}

interface CodeModification {
  filePath: string;
  startLine: number;
  endLine: number;
  operation: 'create' | 'modify' | 'delete';
  changeHash: string;
}

interface ErrorState {
  type: 'syntax' | 'runtime' | 'logical' | 'dependency';
  message: string;
  filePath?: string;
  lineNumber?: number;
  resolved: boolean;
}

interface CompletionStatus {
  status: 'completed' | 'partial' | 'failed' | 'pending';
  progress: number;
  remainingTasks: string[];
}

interface EntryMetadata {
  tokens: number;
  processingTime: number;
  modelVersion: string;
  dependencies: string[];
  contextSize: number;
}

class ChangelogManager {
  private readonly changelogPath: string;
  private readonly entryCache: Map<string, LogEntry> = new Map();
  private readonly maxCacheSize = 1000;
  
  constructor() {
    const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      throw new Error('No workspace folder detected');
    }
    this.changelogPath = path.join(workspaceRoot, 'changelog.md');
  }

  /**
   * Primary entry point - called at beginning of each AI response
   */
  async processAnswerLog(
    question: string,
    answer: string,
    context: {
      fileChanges?: string[];
      codeModifications?: CodeModification[];
      errorStates?: ErrorState[];
      completionStatus?: CompletionStatus;
    }
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.ensureChangelogExists();
      
      const entry = this.createLogEntry(question, answer, context);
      const isDuplicate = await this.checkDuplication(entry);
      
      if (!isDuplicate) {
        await this.appendEntry(entry);
        this.updateCache(entry);
      }
      
      console.log(`Changelog processed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Changelog processing failed:', error);
      // Non-blocking - continue with main AI response
    }
  }

  private async ensureChangelogExists(): Promise<void> {
    try {
      await fs.access(this.changelogPath);
    } catch {
      const header = this.generateMarkdownHeader();
      await fs.writeFile(this.changelogPath, header, 'utf8');
    }
  }

  private createLogEntry(
    question: string,
    answer: string,
    context: any
  ): LogEntry {
    const timestamp = new Date().toISOString();
    const sessionId = this.generateSessionId();
    
    return {
      timestamp,
      sessionId,
      questionHash: this.generateHash(question),
      answerHash: this.generateHash(answer),
      fileChanges: context.fileChanges || [],
      codeModifications: context.codeModifications || [],
      errorStates: context.errorStates || [],
      completionStatus: context.completionStatus || {
        status: 'completed',
        progress: 100,
        remainingTasks: []
      },
      metadata: {
        tokens: this.estimateTokens(question + answer),
        processingTime: 0,
        modelVersion: 'cascade-windsurf-v1',
        dependencies: this.extractDependencies(answer),
        contextSize: question.length + answer.length
      }
    };
  }

  private async checkDuplication(entry: LogEntry): Promise<boolean> {
    // Check cache first
    const cacheKey = `${entry.questionHash}-${entry.answerHash}`;
    if (this.entryCache.has(cacheKey)) {
      return true;
    }

    // Check file content for recent entries (last 100)
    const existingEntries = await this.readRecentEntries(100);
    
    return existingEntries.some(existing => 
      existing.questionHash === entry.questionHash &&
      existing.answerHash === entry.answerHash &&
      this.isWithinTimeWindow(existing.timestamp, entry.timestamp, 300) // 5 minutes
    );
  }

  private async readRecentEntries(limit: number): Promise<LogEntry[]> {
    try {
      const content = await fs.readFile(this.changelogPath, 'utf8');
      const entries = this.parseMarkdownEntries(content);
      return entries.slice(-limit);
    } catch {
      return [];
    }
  }

  private async appendEntry(entry: LogEntry): Promise<void> {
    const markdownEntry = this.formatEntryAsMarkdown(entry);
    await fs.appendFile(this.changelogPath, markdownEntry, 'utf8');
  }

  private formatEntryAsMarkdown(entry: LogEntry): string {
    const sections = [
      `## ${entry.timestamp}`,
      `**Session**: ${entry.sessionId}`,
      `**Status**: ${entry.completionStatus.status} (${entry.completionStatus.progress}%)`,
      `**Processing**: ${entry.metadata.processingTime}ms, ${entry.metadata.tokens} tokens`,
      ''
    ];

    if (entry.fileChanges.length > 0) {
      sections.push('### File Changes');
      entry.fileChanges.forEach(file => sections.push(`- ${file}`));
      sections.push('');
    }

    if (entry.codeModifications.length > 0) {
      sections.push('### Code Modifications');
      entry.codeModifications.forEach(mod => {
        sections.push(`- **${mod.operation}** ${mod.filePath}:${mod.startLine}-${mod.endLine}`);
      });
      sections.push('');
    }

    if (entry.errorStates.length > 0) {
      sections.push('### Error States');
      entry.errorStates.forEach(error => {
        const status = error.resolved ? '✅' : '❌';
        sections.push(`- ${status} **${error.type}**: ${error.message}`);
      });
      sections.push('');
    }

    if (entry.completionStatus.remainingTasks.length > 0) {
      sections.push('### Remaining Tasks');
      entry.completionStatus.remainingTasks.forEach(task => {
        sections.push(`- [ ] ${task}`);
      });
      sections.push('');
    }

    sections.push('---', '');
    return sections.join('\n');
  }

  private generateMarkdownHeader(): string {
    return `# AI Coder Changelog

*Automated logging system for Windsurf AI/Cascade responses*

**Generated**: ${new Date().toISOString()}

---

`;
  }

  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  private generateSessionId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private extractDependencies(answer: string): string[] {
    const importRegex = /import\s+.*?from\s+['"`]([^'"`]+)['"`]/g;
    const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
    
    const dependencies = new Set<string>();
    let match;
    
    while ((match = importRegex.exec(answer)) !== null) {
      dependencies.add(match[1]);
    }
    
    while ((match = requireRegex.exec(answer)) !== null) {
      dependencies.add(match[1]);
    }
    
    return Array.from(dependencies);
  }

  private isWithinTimeWindow(timestamp1: string, timestamp2: string, seconds: number): boolean {
    const time1 = new Date(timestamp1).getTime();
    const time2 = new Date(timestamp2).getTime();
    return Math.abs(time1 - time2) < (seconds * 1000);
  }

  private updateCache(entry: LogEntry): void {
    const cacheKey = `${entry.questionHash}-${entry.answerHash}`;
    this.entryCache.set(cacheKey, entry);
    
    // Maintain cache size limit
    if (this.entryCache.size > this.maxCacheSize) {
      const firstKey = this.entryCache.keys().next().value;
      this.entryCache.delete(firstKey);
    }
  }

  private parseMarkdownEntries(content: string): LogEntry[] {
    // Simplified parser - would need full implementation
    // Returns array of LogEntry objects parsed from markdown
    return [];
  }
}

// VSCode Extension Integration
export class WindsurfChangelogExtension {
  private changelogManager: ChangelogManager;
  
  constructor() {
    this.changelogManager = new ChangelogManager();
  }

  /**
   * Hook into AI response pipeline
   */
  async onAIResponseStart(question: string): Promise<void> {
    // Pre-processing placeholder
    console.log('AI response initiated, changelog ready');
  }

  async onAIResponseComplete(
    question: string,
    answer: string,
    context: any
  ): Promise<void> {
    await this.changelogManager.processAnswerLog(question, answer, context);
  }
}

// Export for VSCode extension manifest
export function activate(context: any) {
  const changelogExtension = new WindsurfChangelogExtension();
  
  // Register command for manual changelog operations
  const disposable = context.subscriptions.push(
    workspace.onDidChangeTextDocument(() => {
      // Track file changes
    })
  );
  
  return changelogExtension;
}