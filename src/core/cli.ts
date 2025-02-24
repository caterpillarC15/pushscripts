#!/usr/bin/env node

import readline from 'readline';
import path from 'path';
import PushScriptsModel from './index';
import { execSync } from 'child_process';
import 'dotenv/config';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function main(): Promise<void> {
  const pushScripts = new PushScriptsModel(OPENAI_API_KEY || '');
  // Check both the script name and the command name for 'push'
  const shouldPush = process.argv[1].endsWith('push') || 
                    process.argv[1].includes('/push') ||
                    path.basename(process.argv[1]) === 'push';
  
  try {
    // Get git status for display
    const changes = pushScripts.getGitStatus();
    if (changes.length === 0) {
      console.log('\x1b[33mNo changes to commit!\x1b[0m');
      process.exit(0);
    }

    // Generate commit message for preview
    const commitMessage = await pushScripts.generateAICommitMessage(changes);
    
    // Confirm with user
    const shouldProceed = await confirmWithUser(commitMessage, shouldPush);
    if (!shouldProceed) {
      console.log('\x1b[33mOperation cancelled by user\x1b[0m');
      process.exit(0);
    }

    // Perform git operations
    if (shouldPush) {
      await pushScripts.push();
      console.log('\x1b[32mSuccessfully committed and pushed changes!\x1b[0m');
    } else {
      await pushScripts.commit();
      console.log('\x1b[32mSuccessfully committed changes!\x1b[0m');
      console.log('\x1b[36mTo push these changes, run:\x1b[0m git push');
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Sensitive files detected') {
      console.error('\x1b[31mError: Attempting to commit sensitive files\x1b[0m');
      console.error('\nPlease remove these files from git:');
      console.error('1. Add them to .gitignore');
      console.error('2. Run: git rm --cached <file>');
    } else {
      console.error('\x1b[31mError:', error instanceof Error ? error.message : 'Unknown error', '\x1b[0m');
    }
    process.exit(1);
  }
}

async function confirmWithUser(commitMessage: string, shouldPush: boolean): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    console.log('\n\x1b[36mProposed Commit Message:\x1b[0m');
    console.log(commitMessage);
    console.log('\nGit Status:');
    execSync('git status', { stdio: 'inherit' });
    
    const action = shouldPush ? 'commit and push' : 'commit';
    rl.question(`\n\x1b[36mProceed with ${action}? (Y/n): \x1b[0m`, answer => {
      rl.close();
      resolve(answer.toLowerCase() !== 'n');
    });
  });
}

main().catch(error => {
  console.error('\x1b[31mUnexpected error:', error instanceof Error ? error.message : 'Unknown error', '\x1b[0m');
  process.exit(1);
}); 