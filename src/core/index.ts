import { execSync } from 'child_process';
import fetch from 'node-fetch';
import debug from 'debug';
import fs from 'fs';
import path from 'path';

const debugLog = debug('pushscripts:*');

interface GitChange {
  status: string;
  file: string;
}

interface ChangeCategories {
  added: string[];
  modified: string[];
  deleted: string[];
  renamed: string[];
  components: Set<string>;
  features: Set<string>;
}

interface Pattern {
  pattern: string;
  original: string;
}

interface SensitivePatterns {
  includePatterns: Pattern[];
  excludePatterns: Pattern[];
}

interface LLMProviderConfig {
  endpoint: string;
  headers: Record<string, string>;
  body: Record<string, any>;
}

type ModelProvider = 'openai' | 'groq' | 'anthropic';

class PushScriptsModel {
  private apiKey: string;
  private defaultBranch: string;
  private defaultSensitivePatterns: string[];
  private defaultModels: Record<ModelProvider, string>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.defaultBranch = process.env.GIT_DEFAULT_BRANCH || 'main';
    
    // Default sensitive file patterns
    this.defaultSensitivePatterns = [
      '.env',
      '.env.*',
      'credentials.json',
      'secrets.json'
    ];
    
    // Default models by provider
    this.defaultModels = {
      openai: 'gpt-4-turbo-preview',
      groq: 'mixtral-8x7b-chat',
      anthropic: 'claude-3-opus'
    };
    
    if (process.env.DEBUG === 'pushscripts:*') {
      debugLog('PushScripts initialized with config:', {
        defaultBranch: this.defaultBranch,
        provider: process.env.PUSHSCRIPTS_MODEL_PROVIDER || 'openai',
        model: process.env.PUSHSCRIPTS_MODEL || this.defaultModels.openai,
        temperature: process.env.PUSHSCRIPTS_TEMPERATURE || 0.3
      });
    }
  }

  addAllChanges(): void {
    debugLog('Adding all changes');
    execSync('git add .', { stdio: 'inherit' });
  }

  async commit(): Promise<string> {
    // Add all changes first
    this.addAllChanges();

    // Check for sensitive files
    const sensitiveFiles = this.checkSensitiveFiles();
    if (sensitiveFiles.length > 0) {
      throw new Error('Sensitive files detected');
    }

    // Get changes
    const changes = this.getGitStatus();
    if (changes.length === 0) {
      throw new Error('No changes to commit');
    }

    // Generate message
    const message = await this.generateAICommitMessage(changes);
    
    // Commit
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    return message;
  }

  async push(): Promise<string> {
    // Commit first
    const message = await this.commit();
    
    // Then push
    execSync('git push', { stdio: 'inherit' });
    return message;
  }

  getGitStatus(): GitChange[] {
    debugLog('Getting git status');
    const status = execSync('git status --porcelain').toString();
    const changes = status
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => ({
        status: line.slice(0, 2).trim(),
        file: line.slice(3)
      }));
    debugLog('Found changes:', changes);
    return changes;
  }

  categorizeChanges(changes: GitChange[]): ChangeCategories {
    const categories: ChangeCategories = {
      added: [],
      modified: [],
      deleted: [],
      renamed: [],
      components: new Set<string>(),
      features: new Set<string>()
    };

    changes.forEach(change => {
      const pathParts = change.file.split('/');
      if (pathParts.includes('components')) {
        const componentIndex = pathParts.indexOf('components');
        if (pathParts[componentIndex + 1]) {
          categories.components.add(pathParts[componentIndex + 1]);
        }
      }
      if (pathParts.includes('features')) {
        const featureIndex = pathParts.indexOf('features');
        if (pathParts[featureIndex + 1]) {
          categories.features.add(pathParts[featureIndex + 1]);
        }
      }

      if (change.status.includes('A')) categories.added.push(change.file);
      else if (change.status.includes('M')) categories.modified.push(change.file);
      else if (change.status.includes('D')) categories.deleted.push(change.file);
      else if (change.status.includes('R')) categories.renamed.push(change.file);
    });

    return categories;
  }

  getSensitivePatterns(): SensitivePatterns {
    // Initialize with default patterns
    let includePatterns: Pattern[] = [...this.defaultSensitivePatterns].map(pattern => ({
      pattern: this.convertToRegex(pattern),
      original: pattern
    }));
    let excludePatterns: Pattern[] = [];
    
    // Check for .gitignore-sensitive file
    try {
      const gitignoreSensitivePath = path.join(process.cwd(), '.gitignore-sensitive');
      if (fs.existsSync(gitignoreSensitivePath)) {
        debugLog('Found .gitignore-sensitive file');
        const fileContent = fs.readFileSync(gitignoreSensitivePath, 'utf8');
        
        fileContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'))
          .forEach(pattern => {
            if (pattern.startsWith('!')) {
              // Negation pattern
              const cleanPattern = pattern.slice(1);
              excludePatterns.push({
                pattern: this.convertToRegex(cleanPattern),
                original: cleanPattern
              });
              debugLog('Added exclusion pattern:', cleanPattern);
            } else {
              // Include pattern
              includePatterns.push({
                pattern: this.convertToRegex(pattern),
                original: pattern
              });
              debugLog('Added inclusion pattern:', pattern);
            }
          });
      }
    } catch (error) {
      debugLog('Error reading .gitignore-sensitive:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Check for environment variable override
    const envPatterns = process.env.PUSHSCRIPTS_SENSITIVE_FILES;
    if (envPatterns) {
      debugLog('Found PUSHSCRIPTS_SENSITIVE_FILES environment variable');
      if (envPatterns.startsWith('override:')) {
        // Override mode: replace all patterns
        includePatterns = [];
        excludePatterns = [];
        envPatterns
          .slice(9)
          .split(',')
          .map(p => p.trim())
          .filter(p => p)
          .forEach(pattern => {
            if (pattern.startsWith('!')) {
              excludePatterns.push({
                pattern: this.convertToRegex(pattern.slice(1)),
                original: pattern.slice(1)
              });
            } else {
              includePatterns.push({
                pattern: this.convertToRegex(pattern),
                original: pattern
              });
            }
          });
        debugLog('Overriding with patterns:', { include: includePatterns, exclude: excludePatterns });
      } else {
        // Append mode: add to existing patterns
        envPatterns
          .split(',')
          .map(p => p.trim())
          .filter(p => p)
          .forEach(pattern => {
            if (pattern.startsWith('!')) {
              excludePatterns.push({
                pattern: this.convertToRegex(pattern.slice(1)),
                original: pattern.slice(1)
              });
            } else {
              includePatterns.push({
                pattern: this.convertToRegex(pattern),
                original: pattern
              });
            }
          });
        debugLog('Appending patterns:', { include: includePatterns, exclude: excludePatterns });
      }
    }

    return { includePatterns, excludePatterns };
  }

  private convertToRegex(pattern: string): string {
    // Convert gitignore pattern to regex pattern
    return pattern
      .replace(/\./g, '\\.')
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.')
      .replace(/\[!/g, '[^')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\//g, '\\/');
  }

  checkSensitiveFiles(): string[] {
    const { includePatterns, excludePatterns } = this.getSensitivePatterns();
    debugLog('Checking for sensitive files with patterns:', { 
      include: includePatterns.map(p => p.original),
      exclude: excludePatterns.map(p => p.original)
    });

    const status = execSync('git status --porcelain').toString();
    const stagedFiles = status
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => line.slice(3));

    const sensitiveFiles = stagedFiles.filter(file => {
      // Check if file matches any include pattern
      const isIncluded = includePatterns.some(({ pattern }) => new RegExp(pattern).test(file));
      
      // If included, check if it's explicitly excluded
      if (isIncluded) {
        const isExcluded = excludePatterns.some(({ pattern }) => new RegExp(pattern).test(file));
        return !isExcluded;
      }
      
      return false;
    });

    if (sensitiveFiles.length > 0) {
      debugLog('Found sensitive files:', sensitiveFiles);
    }

    return sensitiveFiles;
  }

  async generateAICommitMessage(changes: GitChange[]): Promise<string> {
    if (!this.apiKey) {
      return this.generateBasicCommitMessage(changes);
    }

    try {
      const categories = this.categorizeChanges(changes);
      const changesDescription = this.formatChangesDescription(categories);
      const diff = execSync('git diff --staged').toString();

      const message = await this.callLLMAPI(changesDescription, diff);
      return this.validateAndFormatMessage(message);
    } catch (error) {
      console.log('\x1b[33mError generating AI commit message, falling back to basic generation:\x1b[0m', error instanceof Error ? error.message : 'Unknown error');
      return this.generateBasicCommitMessage(changes);
    }
  }

  generateBasicCommitMessage(changes: GitChange[]): string {
    const categories = this.categorizeChanges(changes);
    
    let type = 'chore';
    let scope = '';
    let description = '';

    const isMainlyModifications = categories.modified.length > categories.added.length;

    if (isMainlyModifications) {
      if (categories.modified.some(f => f.includes('style') || f.includes('css'))) {
        type = 'style';
        description = 'update styling';
      } else if (categories.components.size > 0) {
        type = 'fix';
        scope = 'ui';
        description = 'update components';
      } else {
        type = 'fix';
        description = 'update implementation';
      }
    } else if (categories.added.length > 0) {
      type = 'feat';
      if (categories.components.size === 1) {
        scope = 'ui';
        description = `add ${Array.from(categories.components)[0]}`;
      } else {
        description = 'add new features';
      }
    }

    return scope ? `${type}(${scope}): ${description}` : `${type}: ${description}`;
  }

  private formatChangesDescription(categories: ChangeCategories): string {
    return [
      `Modified files: ${categories.modified.join(', ')}`,
      `Added files: ${categories.added.join(', ')}`,
      `Deleted files: ${categories.deleted.join(', ')}`,
      `Components affected: ${Array.from(categories.components).join(', ')}`,
      `Features affected: ${Array.from(categories.features).join(', ')}`
    ].filter(line => !line.endsWith(': ')).join('\n');
  }

  private buildPrompt(changesDescription: string): string {
    return `You are a Git commit message expert. Generate a single line commit message following the Conventional Commits format for these changes:

${changesDescription}

Requirements:
- Format: type(optional-scope): description
- Type must be one of: feat, fix, docs, style, refactor, test, chore
- Description must use imperative mood ("add" not "added")
- Keep the entire message under 72 characters
- Focus on the WHAT and WHY, not HOW
- Be specific but concise

Return ONLY the commit message, nothing else.`;
  }

  private async callLLMAPI(changesDescription: string, diff: string): Promise<string> {
    const provider = (process.env.PUSHSCRIPTS_MODEL_PROVIDER || 'openai') as ModelProvider;
    const model = process.env.PUSHSCRIPTS_MODEL || this.defaultModels[provider];
    const temperature = parseFloat(process.env.PUSHSCRIPTS_TEMPERATURE || '0.3');
    
    debugLog('Calling LLM API with config:', { provider, model, temperature });
    debugLog('Changes:', changesDescription);

    let config: LLMProviderConfig;

    switch (provider.toLowerCase()) {
      case 'openai':
        config = {
          endpoint: 'https://api.openai.com/v1/chat/completions',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v1'
          },
          body: {
            model,
            messages: [
              {
                role: 'system',
                content: 'You are a Git commit message expert. Your task is to generate clear, concise commit messages following the Conventional Commits format. Always respond with just the commit message, no additional text.'
              },
              {
                role: 'user',
                content: this.buildPrompt(changesDescription)
              }
            ],
            temperature,
            max_tokens: 60,
            presence_penalty: 0,
            frequency_penalty: 0,
            response_format: { type: "text" }
          }
        };
        break;

      case 'groq':
        config = {
          endpoint: 'https://api.groq.com/openai/v1/chat/completions',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: {
            model,
            messages: [
              {
                role: 'system',
                content: 'You are a Git commit message expert that generates clear, concise, and informative commit messages following conventional commits format.'
              },
              {
                role: 'user',
                content: this.buildPrompt(changesDescription)
              }
            ],
            temperature,
            max_tokens: 200
          }
        };
        break;

      case 'anthropic':
        config = {
          endpoint: 'https://api.anthropic.com/v1/messages',
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          },
          body: {
            model,
            messages: [
              {
                role: 'user',
                content: this.buildPrompt(changesDescription)
              }
            ],
            max_tokens: 200
          }
        };
        break;

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(config.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      debugLog('API error:', response.status, response.statusText, errorText);
      throw new Error(`${provider} API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const generatedMessage = data.choices[0].message.content.trim();
    debugLog('Generated commit message:', generatedMessage);
    return generatedMessage;
  }

  private validateAndFormatMessage(message: string): string {
    if (!/^(feat|fix|docs|style|refactor|test|chore)(\([a-z-]+\))?: .+/.test(message)) {
      console.log('\x1b[33mAI generated message does not match conventional format, falling back to basic generation\x1b[0m');
      return this.generateBasicCommitMessage(this.getGitStatus());
    }
    return message;
  }
}

export default PushScriptsModel; 