/**
 * Git operations for PushScript
 * Handles git status, change categorization, and commit operations
 */

import { execSync } from 'child_process';
import readline from 'readline';

// Define interfaces for git changes and categorization
export interface GitChange {
  status: string;
  file: string;
}

export interface ChangeCategories {
  added: string[];
  modified: string[];
  deleted: string[];
  renamed: string[];
  components: Set<string>;
  features: Set<string>;
}

/**
 * Gets the current git status as an array of changes
 * @returns Array of changes with status and filename
 */
export function getGitStatus(): GitChange[] {
  try {
    const status = execSync('git status --porcelain').toString();
    const changes = status
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => ({
        status: line.slice(0, 2).trim(),
        file: line.slice(3)
      }));
    return changes;
  } catch (error) {
    console.error('Error getting git status:', error);
    return [];
  }
}

/**
 * Categorizes git changes into added, modified, deleted, renamed
 * Also identifies component and feature changes
 * @param changes Array of git changes from getGitStatus
 * @returns Categorized changes
 */
export function categorizeChanges(changes: GitChange[]): ChangeCategories {
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
    
    // Identify components and features
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

    // Categorize by change type
    if (change.status.includes('A')) categories.added.push(change.file);
    else if (change.status.includes('M')) categories.modified.push(change.file);
    else if (change.status.includes('D')) categories.deleted.push(change.file);
    else if (change.status.includes('R')) categories.renamed.push(change.file);
  });

  return categories;
}

/**
 * Generates a simple commit message based on the changes
 * Used as a fallback when AI generation fails
 * @param changes Array of git changes
 * @returns Generated commit message
 */
export function generateSimpleCommitMessage(changes: GitChange[]): string {
  const categories = categorizeChanges(changes);
  let type = 'chore';
  let scope = '';
  
  // Determine commit type
  if (categories.added.length > 0 && categories.modified.length === 0) {
    type = 'feat';
  } else if (categories.modified.length > 0) {
    type = 'fix';
  }
  
  // Determine scope
  if (categories.components.size === 1) {
    scope = `(${Array.from(categories.components)[0]})`;
  } else if (categories.features.size === 1) {
    scope = `(${Array.from(categories.features)[0]})`;
  }
  
  // Generate message text
  let message = '';
  
  if (categories.added.length > 0) {
    message += `add ${categories.added.length} file${categories.added.length > 1 ? 's' : ''}`;
  }
  
  if (categories.modified.length > 0) {
    if (message) message += ', ';
    message += `update ${categories.modified.length} file${categories.modified.length > 1 ? 's' : ''}`;
  }
  
  if (categories.deleted.length > 0) {
    if (message) message += ', ';
    message += `remove ${categories.deleted.length} file${categories.deleted.length > 1 ? 's' : ''}`;
  }
  
  // Return in conventional format
  return `${type}${scope}: ${message}`;
}

/**
 * Gets the current git branch name
 * @returns Current branch name
 */
export function getCurrentBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (error) {
    console.error('Error getting current branch:', error);
    return 'unknown';
  }
}

/**
 * Prompts the user for confirmation before executing a git push
 * @returns Promise that resolves to boolean indicating user confirmation
 */
export function confirmPush(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Push changes to remote? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
} 