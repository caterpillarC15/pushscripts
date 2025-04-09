/**
 * Security functions for PushScript
 * Handles sensitive file detection and security checks
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

// Interfaces for security patterns
export interface Pattern {
  pattern: string;
  original: string;
}

export interface SensitivePatterns {
  includePatterns: Pattern[];
  excludePatterns: Pattern[];
}

/**
 * Default sensitive file patterns to check
 */
const defaultSensitivePatterns: string[] = [
  '.env',
  '.env.*',
  'credentials.json',
  'secrets.json',
  '*password*',
  '*key.json',
  '*secret*',
  '*.pem',
  '*.key'
];

/**
 * Convert a glob pattern to regex pattern
 * @param pattern Glob pattern like *.env
 * @returns Regex pattern string
 */
function convertToRegex(pattern: string): string {
  return pattern
    .replace(/\./g, '\\.')  // Escape dots
    .replace(/\*/g, '.*')   // * becomes .*
    .replace(/\?/g, '.')    // ? becomes .
    .replace(/\[([^\]]+)\]/g, '[$1]'); // Preserve character classes
}

/**
 * Gets sensitive file patterns from .gitignore-sensitive or defaults
 * @returns Sensitive patterns configuration
 */
export function getSensitivePatterns(): SensitivePatterns {
  // Initialize with default patterns
  let includePatterns: Pattern[] = [...defaultSensitivePatterns].map(pattern => ({
    pattern: convertToRegex(pattern),
    original: pattern
  }));
  let excludePatterns: Pattern[] = [];
  
  // Check for .gitignore-sensitive file
  try {
    const gitignoreSensitivePath = path.join(process.cwd(), '.gitignore-sensitive');
    if (fs.existsSync(gitignoreSensitivePath)) {
      console.log('Found .gitignore-sensitive file');
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
              pattern: convertToRegex(cleanPattern),
              original: cleanPattern
            });
          } else {
            // Include pattern
            includePatterns.push({
              pattern: convertToRegex(pattern),
              original: pattern
            });
          }
        });
    }
  } catch (error) {
    console.warn('Error reading .gitignore-sensitive:', error);
  }
  
  return { includePatterns, excludePatterns };
}

/**
 * Checks for sensitive files in git staged changes
 * @returns Array of detected sensitive files
 */
export function checkSensitiveFiles(): string[] {
  const stagedFiles = execSync('git diff --name-only --cached').toString().split('\n').filter(Boolean);
  const { includePatterns, excludePatterns } = getSensitivePatterns();
  
  const sensitiveFiles: string[] = [];
  
  for (const file of stagedFiles) {
    // Check if file matches any include pattern
    const isIncluded = includePatterns.some(pattern => {
      const regex = new RegExp(`^${pattern.pattern}$`);
      return regex.test(file) || regex.test(path.basename(file));
    });
    
    // Check if file should be excluded
    const isExcluded = excludePatterns.some(pattern => {
      const regex = new RegExp(`^${pattern.pattern}$`);
      return regex.test(file) || regex.test(path.basename(file));
    });
    
    // If file is both included and not excluded, it's sensitive
    if (isIncluded && !isExcluded) {
      sensitiveFiles.push(file);
    }
  }
  
  return sensitiveFiles;
}

/**
 * Checks for vulnerable dependencies in package.json
 * Simple implementation that can be expanded
 * @returns True if vulnerabilities found
 */
export function checkDependencyVulnerabilities(): boolean {
  try {
    // Only implement if package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }
    
    // Run pnpm audit if available
    try {
      const auditResult = execSync('pnpm audit --json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      const audit = JSON.parse(auditResult);
      
      // Process pnpm audit output
      if (audit.vulnerabilities) {
        // Format differs from npm audit
        const totalHighOrCritical = (audit.vulnerabilities.high || 0) + (audit.vulnerabilities.critical || 0);
        
        if (totalHighOrCritical > 0) {
          console.warn('Security vulnerabilities found in dependencies!');
          console.warn(`High: ${audit.vulnerabilities.high || 0}, Critical: ${audit.vulnerabilities.critical || 0}`);
          
          if (audit.advisories) {
            console.warn('Critical advisories:');
            Object.values(audit.advisories)
              .filter((adv: any) => adv.severity === 'high' || adv.severity === 'critical')
              .forEach((adv: any) => {
                console.warn(`- ${adv.module_name}: ${adv.title}`);
              });
          }
          
          return true;
        }
      }
    } catch (e) {
      // pnpm audit failed, try npm audit as fallback
      try {
        const npmAuditResult = execSync('npm audit --json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
        const npmAudit = JSON.parse(npmAuditResult);
        
        if (npmAudit.vulnerabilities && 
            (npmAudit.vulnerabilities.high > 0 || npmAudit.vulnerabilities.critical > 0)) {
          console.warn('Security vulnerabilities found in dependencies (npm audit)!');
          console.warn(`High: ${npmAudit.vulnerabilities.high}, Critical: ${npmAudit.vulnerabilities.critical}`);
          return true;
        }
      } catch (npmError) {
        // Both audit commands failed, might not be available or other issue
      }
    }
    
    return false;
  } catch (error) {
    console.warn('Error checking dependencies:', error);
    return false;
  }
}

/**
 * Prompt user for confirmation with a question
 * @param question The question to ask
 * @returns Promise resolving to boolean based on user input
 */
export function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
} 