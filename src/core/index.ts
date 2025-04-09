/**
 * PushScript - Enhanced Git workflow automation
 * Main entry point for the pushscript module
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Import module components
import { getProviderConfig, buildApiRequest } from './providers';
import { checkSensitiveFiles, checkDependencyVulnerabilities, promptUser } from './security';
import { detectDependencyConflicts, analyzeDependencyConflictsWithLLM } from './dependency';
import { getGitStatus, categorizeChanges, generateSimpleCommitMessage, getCurrentBranch, confirmPush } from './git';
import { colorize, logInfo, logSuccess, logWarning, logError, logTitle, logList, displayHelp } from './formatting';

/**
 * Load environment variables from .env.local first, then fall back to .env
 */
function loadEnvironmentVariables(): void {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envPath = path.join(process.cwd(), '.env');

  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  // Check API key information
  const providerDetails = getProviderConfig();
  const { name, apiKey, model } = providerDetails;

  if (!apiKey) {
    logWarning('No PushScript LLM API key found in .env.local or .env file.');
    logWarning('AI-powered commit messages will not be available.');
    logWarning('Please set PUSHSCRIPT_LLM_API_KEY in your .env file.');
  } else {
    logSuccess(`PushScript using ${name} for AI commit generation`);
    
    if (model) {
      logSuccess(`Using model: ${model}`);
    } else {
      logWarning(`Using ${name} default model (no model specified)`);
    }
  }
}

/**
 * Generate a commit message using an AI provider
 * @param changes Array of changes from getGitStatus()
 * @returns Generated commit message
 */
async function generateAICommitMessage(changes: any[]): Promise<string> {
  const providerDetails = getProviderConfig();
  const { name, apiKey, model } = providerDetails;
  
  if (!apiKey) {
    logWarning('No API key found, falling back to standard message generation');
    return generateSimpleCommitMessage(changes);
  }

  try {
    const categories = categorizeChanges(changes);
    
    // Create a detailed description of changes
    const changesDescription = [
      `Modified files: ${categories.modified.join(', ')}`,
      `Added files: ${categories.added.join(', ')}`,
      `Deleted files: ${categories.deleted.join(', ')}`,
      `Components affected: ${Array.from(categories.components).join(', ')}`,
      `Features affected: ${Array.from(categories.features).join(', ')}`
    ].filter(line => !line.endsWith(': ')).join('\n');

    // Get git diff but limit its size
    let diff = execSync('git diff --staged').toString();
    // If diff is too large, only include file names and stats
    if (diff.length > 2000) {
      diff = execSync('git diff --staged --stat').toString();
      logWarning('Diff too large, using summary instead');
    }

    const prompt = `As a senior developer, create a concise git commit message for these changes.
Focus on the key changes and their purpose. Keep it brief but informative.

Changes Overview:
${changesDescription}

${diff.length > 2000 ? 'Changes Summary:' : 'Git Diff:'}
\`\`\`
${diff.substring(0, 2000)}${diff.length > 2000 ? '...' : ''}
\`\`\`

Follow conventional commits format:
type(scope): concise summary

Where type is one of: feat, fix, docs, style, refactor, perf, test, chore
Keep the first line under 80 characters.`;

    try {
      logInfo(`Generating commit message using ${name}${model ? '/' + model : ' (default model)'}...`);
      
      // Use the buildApiRequest helper to create the request
      const { request, endpoint } = await buildApiRequest(providerDetails, prompt, 150);
      
      // Send the API request
      const response = await fetch(endpoint, request);
      
      // Handle errors with detailed information
      if (!response.ok) {
        let errorDetails = '';
        try {
          const errorJson = await response.json();
          errorDetails = JSON.stringify(errorJson, null, 2);
        } catch (e) {
          try {
            errorDetails = await response.text();
          } catch (e2) {
            errorDetails = `Status: ${response.status} ${response.statusText}`;
          }
        }
        
        logError(`API request failed: ${errorDetails}`);
        throw new Error(`API request failed: ${errorDetails}`);
      }

      const data = await response.json();
      const config = providerDetails.config;
      const message = config.responseHandler(data);
      
      // Validate the message format - allowing for more detailed messages
      const firstLine = message.split('\n')[0];
      if (!/^(feat|fix|docs|style|refactor|perf|test|chore)(\([a-z-]+\))?: .+/.test(firstLine)) {
        logWarning('AI generated message does not match conventional format, falling back to standard generation');
        return generateSimpleCommitMessage(changes);
      }

      if (firstLine.length > 80) {
        logWarning('AI generated message first line exceeds 80 characters, falling back to standard generation');
        return generateSimpleCommitMessage(changes);
      }

      logSuccess(`AI Generated Commit Message:`);
      message.split('\n').forEach(line => console.log(colorize(line, 'white')));
      
      return message;

    } catch (error) {
      logError(`${name} API Error: ${error}`);
      return generateSimpleCommitMessage(changes);
    }

  } catch (error) {
    logWarning(`Error generating AI commit message, falling back to standard generation: ${error}`);
    return generateSimpleCommitMessage(changes);
  }
}

/**
 * Add all changes to git staging
 */
function addAllChanges(): void {
  logInfo('Adding all changes');
  try {
    execSync('git add .', { stdio: 'inherit' });
  } catch (error) {
    logError(`Error adding changes: ${error}`);
    throw error;
  }
}

/**
 * Commit changes with the given message or generate one
 * @param message Optional commit message
 * @returns Generated or provided commit message
 */
export async function commit(message?: string): Promise<string> {
  loadEnvironmentVariables();
  
  // Add all changes first
  addAllChanges();

  // Check for sensitive files
  const sensitiveFiles = checkSensitiveFiles();
  if (sensitiveFiles.length > 0) {
    logError('Sensitive files detected:');
    sensitiveFiles.forEach(file => {
      logWarning(`- ${file}`);
    });
    
    const proceed = await promptUser('These files might contain sensitive data. Continue anyway?');
    if (!proceed) {
      throw new Error('Commit aborted due to sensitive files');
    }
  }

  // Get changes
  const changes = getGitStatus();
  if (changes.length === 0) {
    logWarning('No changes to commit');
    throw new Error('No changes to commit');
  }

  // Check for dependency conflicts
  const conflicts = detectDependencyConflicts();
  if (conflicts.length > 0) {
    logWarning('Dependency conflicts detected:');
    conflicts.forEach(conflict => {
      logWarning(`- ${conflict}`);
    });
    
    // Optionally analyze with LLM
    const analyze = await promptUser('Would you like AI to analyze these conflicts?');
    if (analyze) {
      const analysis = await analyzeDependencyConflictsWithLLM(conflicts);
      logInfo('Dependency Analysis:');
      console.log(colorize(analysis, 'white'));
    }
    
    const proceed = await promptUser('Continue with commit despite dependency conflicts?');
    if (!proceed) {
      throw new Error('Commit aborted due to dependency conflicts');
    }
  }

  // Generate or use provided message
  const finalMessage = message || await generateAICommitMessage(changes);
  
  // Commit
  try {
    logInfo(`Committing changes with message: "${finalMessage.split('\n')[0]}"`);
    execSync(`git commit -m "${finalMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    logSuccess('Changes committed successfully');
    return finalMessage;
  } catch (error) {
    logError(`Error committing changes: ${error}`);
    throw error;
  }
}

/**
 * Push changes to remote
 * @param message Optional commit message
 * @param branch Optional branch name
 * @returns Commit message
 */
export async function push(message?: string, branch?: string): Promise<string> {
  // Commit first
  const commitMessage = await commit(message);
  
  // Get current branch
  const currentBranch = branch || getCurrentBranch();
  
  // Confirm push
  const shouldPush = await confirmPush();
  if (!shouldPush) {
    logInfo('Push cancelled');
    return commitMessage;
  }
  
  // Then push
  try {
    logInfo(`Pushing to ${currentBranch}...`);
    execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
    logSuccess(`Successfully pushed to ${currentBranch}`);
    return commitMessage;
  } catch (error) {
    logError(`Error pushing changes: ${error}`);
    throw error;
  }
}

// Export core functionality
export { getGitStatus, categorizeChanges, generateSimpleCommitMessage };
export { checkSensitiveFiles, checkDependencyVulnerabilities };
export { detectDependencyConflicts, analyzeDependencyConflictsWithLLM };
export { logInfo, logSuccess, logWarning, logError, logTitle, logList, displayHelp };

// Initialize environment variables when module is loaded
loadEnvironmentVariables(); 