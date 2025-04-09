/**
 * Dependency management functions for PushScript
 * Handles dependency conflict detection and resolution suggestions
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getProviderConfig, buildApiRequest } from '../providers';
import { logWarning, logError, logInfo } from '../formatting';

/**
 * Detects conflicts in package dependencies
 * @returns Array of detected conflicts
 */
export function detectDependencyConflicts(): string[] {
  const conflicts: string[] = [];
  
  try {
    // Only proceed if package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return conflicts;
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};
    const peerDependencies = packageJson.peerDependencies || {};
    
    // Check for duplicate packages across different dependency types
    const allDependencies = new Map<string, string[]>();
    
    // Helper to add dependencies to the map
    const addToMap = (deps: Record<string, string>, type: string) => {
      Object.entries(deps).forEach(([name, version]) => {
        if (!allDependencies.has(name)) {
          allDependencies.set(name, []);
        }
        allDependencies.get(name)!.push(`${type}: ${version}`);
      });
    };
    
    // Collect all dependencies by type
    addToMap(dependencies, 'dependencies');
    addToMap(devDependencies, 'devDependencies');
    addToMap(peerDependencies, 'peerDependencies');
    
    // Find packages with multiple versions or types
    allDependencies.forEach((versions, name) => {
      if (versions.length > 1) {
        conflicts.push(`Package '${name}' has multiple entries: ${versions.join(', ')}`);
      }
    });
    
    // Try to run pnpm check for more thorough analysis
    try {
      // Use pnpm list instead of npm ls
      const output = execSync('pnpm list --json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
      const pnpmList = JSON.parse(output);
      
      // Process pnpm list output (format differs from npm)
      if (pnpmList.problems && Array.isArray(pnpmList.problems)) {
        pnpmList.problems.forEach((problem: string) => {
          conflicts.push(`pnpm dependency problem: ${problem}`);
        });
      }
      
      // Optionally check for outdated packages
      try {
        const outdatedOutput = execSync('pnpm outdated --format json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
        if (outdatedOutput.trim()) {
          const outdatedPackages = JSON.parse(outdatedOutput);
          Object.entries(outdatedPackages).forEach(([name, info]: [string, any]) => {
            if (info.latest && info.current && info.latest !== info.current) {
              conflicts.push(`Outdated package '${name}': current ${info.current}, latest ${info.latest}`);
            }
          });
        }
      } catch (e) {
        // Outdated check failed, ignore
      }
    } catch (e: any) {
      // pnpm list might exit with non-zero code if there are issues
      if (e.stdout) {
        try {
          const output = JSON.parse(e.stdout.toString());
          if (output.problems && Array.isArray(output.problems)) {
            output.problems.forEach((problem: string) => {
              conflicts.push(`pnpm dependency problem: ${problem}`);
            });
          }
        } catch (jsonError) {
          // Unable to parse JSON, ignore
        }
      }
      
      // Fallback to pnpm-lock.yaml analysis
      const lockFilePath = path.join(process.cwd(), 'pnpm-lock.yaml');
      if (fs.existsSync(lockFilePath)) {
        const lockFileContent = fs.readFileSync(lockFilePath, 'utf8');
        // Basic check for potential conflicts indicated by multiple versions
        const packageVersions = new Map<string, Set<string>>();
        
        // Very simplified parsing - a real implementation would use a proper YAML parser
        const packageMatches = lockFileContent.matchAll(/\/([^/]+)@([^:]+):/g);
        if (packageMatches) {
          for (const match of packageMatches) {
            const [_, pkg, version] = match;
            if (!packageVersions.has(pkg)) {
              packageVersions.set(pkg, new Set());
            }
            packageVersions.get(pkg)!.add(version);
          }
          
          // Check for packages with multiple versions
          packageVersions.forEach((versions, pkg) => {
            if (versions.size > 1) {
              conflicts.push(`Multiple versions of '${pkg}' in lock file: ${Array.from(versions).join(', ')}`);
            }
          });
        }
      }
    }
    
    return conflicts;
  } catch (error) {
    logWarning(`Error checking dependencies: ${error}`);
    return conflicts;
  }
}

/**
 * Analyzes dependency conflicts using LLM to provide resolution advice
 * @param conflicts Array of detected conflicts
 * @returns Promise resolving to resolution suggestions
 */
export async function analyzeDependencyConflictsWithLLM(conflicts: string[]): Promise<string> {
  if (conflicts.length === 0) {
    return 'No conflicts detected.';
  }
  
  try {
    const providerDetails = getProviderConfig();
    const { apiKey } = providerDetails;
    
    if (!apiKey) {
      return 'No API key available for dependency analysis.';
    }
    
    // Get package.json content
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJsonContent = fs.existsSync(packageJsonPath) 
      ? fs.readFileSync(packageJsonPath, 'utf8')
      : '{}';
    
    // Get pnpm-lock.yaml overview if available
    const lockFilePath = path.join(process.cwd(), 'pnpm-lock.yaml');
    const lockFileOverview = fs.existsSync(lockFilePath)
      ? `pnpm-lock.yaml exists (${Math.round(fs.statSync(lockFilePath).size / 1024)} KB)`
      : 'No pnpm-lock.yaml found';
    
    // Create prompt for the LLM
    const prompt = `Analyze these dependency conflicts in a Node.js project using pnpm and suggest solutions:
    
Conflicts:
${conflicts.join('\n')}

Package.json:
\`\`\`json
${packageJsonContent}
\`\`\`

Lock file: ${lockFileOverview}

Provide specific, actionable steps to resolve these conflicts. Focus on maintaining compatibility
while eliminating version conflicts or duplications. Include appropriate pnpm commands to fix issues.`;

    // Get the API request configuration
    const { request, endpoint } = await buildApiRequest(providerDetails, prompt, 1000);
    
    logInfo(`Analyzing dependency conflicts using ${providerDetails.name}...`);
    
    // Send the API request
    const response = await fetch(endpoint, request);
    
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
      return 'Failed to analyze dependencies.';
    }
    
    const data = await response.json();
    const analysis = providerDetails.config.responseHandler(data);
    
    return analysis;
  } catch (error) {
    logError(`Error analyzing dependencies: ${error}`);
    return 'Error during dependency analysis.';
  }
} 