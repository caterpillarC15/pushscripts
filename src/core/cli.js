#!/usr/bin/env node

const readline = require('readline');
const GitPushAI = require('./index');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function main() {
  const gitPush = new GitPushAI(OPENAI_API_KEY);
  const shouldPush = process.argv[1].endsWith('push');
  
  try {
    // Get git status for display
    const changes = gitPush.getGitStatus();
    if (changes.length === 0) {
      console.log('\x1b[33mNo changes to commit!\x1b[0m');
      process.exit(0);
    }

    // Generate commit message for preview
    const commitMessage = await gitPush.generateAICommitMessage(changes);
    
    // Confirm with user
    const shouldProceed = await confirmWithUser(commitMessage, shouldPush);
    if (!shouldProceed) {
      console.log('\x1b[33mOperation cancelled by user\x1b[0m');
      process.exit(0);
    }

    // Perform git operations
    if (shouldPush) {
      await gitPush.push();
      console.log('\x1b[32mSuccessfully committed and pushed changes!\x1b[0m');
    } else {
      await gitPush.commit();
      console.log('\x1b[32mSuccessfully committed changes!\x1b[0m');
      console.log('\x1b[36mTo push these changes, run:\x1b[0m git push');
    }
  } catch (error) {
    if (error.message === 'Sensitive files detected') {
      console.error('\x1b[31mError: Attempting to commit sensitive files\x1b[0m');
      console.error('\nPlease remove these files from git:');
      console.error('1. Add them to .gitignore');
      console.error('2. Run: git rm --cached <file>');
    } else {
      console.error('\x1b[31mError:', error.message, '\x1b[0m');
    }
    process.exit(1);
  }
}

async function confirmWithUser(commitMessage, shouldPush) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    console.log('\n\x1b[36mProposed Commit Message:\x1b[0m');
    console.log(commitMessage);
    console.log('\nGit Status:');
    require('child_process').execSync('git status', { stdio: 'inherit' });
    
    const action = shouldPush ? 'commit and push' : 'commit';
    rl.question(`\n\x1b[36mProceed with ${action}? (Y/n): \x1b[0m`, answer => {
      rl.close();
      resolve(answer.toLowerCase() !== 'n');
    });
  });
}

main().catch(error => {
  console.error('\x1b[31mUnexpected error:', error.message, '\x1b[0m');
  process.exit(1);
}); 