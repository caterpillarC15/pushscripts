#!/usr/bin/env node

/**
 * CLI entry point for PushScript
 * Handles command-line arguments and executes appropriate functions
 */

import { commit, push } from './index';
import { displayHelp, logError, logWarning } from './formatting';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'push'; // Default to 'push' if no command provided
  
  try {
    switch (command.toLowerCase()) {
      case 'commit':
        // If a message is provided, use it; otherwise, generate one
        await commit(args[1]);
        break;
        
      case 'push':
        // If a message is provided, use it; otherwise, generate one
        await push(args[1], args[2]);
        break;
        
      case 'help':
      case '--help':
      case '-h':
        displayHelp();
        break;
        
      default:
        if (command.startsWith('-')) {
          // Handle as a flag to the default push command
          logWarning(`Unknown flag: ${command}, running push command`);
          await push();
        } else {
          // Assume it's a custom commit message for push
          await push(command);
        }
    }
  } catch (error) {
    if (error instanceof Error) {
      logError(error.message);
      process.exit(1);
    } else {
      logError('An unknown error occurred');
      process.exit(1);
    }
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 