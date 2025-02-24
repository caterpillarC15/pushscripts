const { execSync } = require('child_process');
const fetch = require('node-fetch');

class GitPushAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  getGitStatus() {
    const status = execSync('git status --porcelain').toString();
    return status
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => ({
        status: line.slice(0, 2).trim(),
        file: line.slice(3)
      }));
  }

  categorizeChanges(changes) {
    const categories = {
      added: [],
      modified: [],
      deleted: [],
      renamed: [],
      components: new Set(),
      features: new Set()
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

  checkSensitiveFiles() {
    const sensitivePatterns = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.test',
      'credentials.json',
      'secrets.json'
    ];

    const status = execSync('git status --porcelain').toString();
    const stagedFiles = status
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => line.slice(3));

    return stagedFiles.filter(file =>
      sensitivePatterns.some(pattern => file.includes(pattern))
    );
  }

  async generateAICommitMessage(changes) {
    if (!this.apiKey) {
      return this.generateBasicCommitMessage(changes);
    }

    try {
      const categories = this.categorizeChanges(changes);
      const changesDescription = this.formatChangesDescription(categories);
      const diff = execSync('git diff --staged').toString();

      const message = await this.callGroqAPI(changesDescription, diff);
      return this.validateAndFormatMessage(message);
    } catch (error) {
      console.log('\x1b[33mError generating AI commit message, falling back to basic generation:\x1b[0m', error.message);
      return this.generateBasicCommitMessage(changes);
    }
  }

  generateBasicCommitMessage(changes) {
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

  formatChangesDescription(categories) {
    return [
      `Modified files: ${categories.modified.join(', ')}`,
      `Added files: ${categories.added.join(', ')}`,
      `Deleted files: ${categories.deleted.join(', ')}`,
      `Components affected: ${Array.from(categories.components).join(', ')}`,
      `Features affected: ${Array.from(categories.features).join(', ')}`
    ].filter(line => !line.endsWith(': ')).join('\n');
  }

  async callGroqAPI(changesDescription, diff) {
    const response = await fetch('https://api.groq.com/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.COMMIT_MESSAGE_MODEL || 'llama2-70b-chat',
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
        temperature: parseFloat(process.env.COMMIT_MESSAGE_TEMPERATURE) || 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  buildPrompt(changesDescription) {
    return `As a Git commit message expert, analyze these changes and generate a clear, informative commit message following conventional commits format.

Changes Overview:
${changesDescription}

Key points:
1. Use format: type(scope): description
2. Types: feat, fix, docs, style, refactor, test, chore
3. Keep first line under 72 chars
4. Be specific but concise
5. Focus on WHY and WHAT, not HOW
6. Use imperative mood ("add" not "added")

Generate a commit message that best describes these changes.`;
  }

  validateAndFormatMessage(message) {
    if (!/^(feat|fix|docs|style|refactor|test|chore)(\([a-z-]+\))?: .+/.test(message)) {
      console.log('\x1b[33mAI generated message does not match conventional format, falling back to basic generation\x1b[0m');
      return this.generateBasicCommitMessage(changes);
    }
    return message;
  }
}

module.exports = GitPushAI; 