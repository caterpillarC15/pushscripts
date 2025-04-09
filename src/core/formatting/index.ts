/**
 * Formatting helpers for PushScript
 * Handles console output formatting with colors
 */

// Type for available colors
export type ColorName = 'reset' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'bold' | 'dim' | 'italic' | 'underline';

// Color code mappings
const COLORS: Record<ColorName, string> = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m'
};

/**
 * Apply color to a string
 * @param text The text to colorize
 * @param color The color to apply
 * @returns The colorized string
 */
export function colorize(text: string, color: ColorName): string {
  // Check if color output is supported and enabled
  if (process.env.NO_COLOR || !process.stdout.isTTY) {
    return text;
  }
  
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

/**
 * Log an info message in blue
 * @param message The message to log
 */
export function logInfo(message: string): void {
  console.log(colorize(`ℹ️  ${message}`, 'blue'));
}

/**
 * Log a success message in green
 * @param message The message to log
 */
export function logSuccess(message: string): void {
  console.log(colorize(`✅ ${message}`, 'green'));
}

/**
 * Log a warning message in yellow
 * @param message The message to log
 */
export function logWarning(message: string): void {
  console.log(colorize(`⚠️  ${message}`, 'yellow'));
}

/**
 * Log an error message in red
 * @param message The message to log
 */
export function logError(message: string): void {
  console.log(colorize(`❌ ${message}`, 'red'));
}

/**
 * Log a title in bold cyan
 * @param title The title to log
 */
export function logTitle(title: string): void {
  console.log('\n' + colorize(title, 'cyan') + colorize(':', 'bold'));
}

/**
 * Log a list of items with bullet points
 * @param items Array of items to list
 * @param color Optional color for the items
 */
export function logList(items: string[], color: ColorName = 'white'): void {
  items.forEach(item => {
    console.log(`  ${colorize('•', 'dim')} ${colorize(item, color)}`);
  });
  console.log('');
}

/**
 * Display help information
 */
export function displayHelp(): void {
  logTitle('PushScript Commands');
  
  console.log(colorize('  push', 'green') + ' - Commit and push changes with AI-generated message');
  console.log(colorize('  commit', 'green') + ' - Commit changes with AI-generated message');
  console.log(colorize('  help', 'green') + ' - Display this help message');
  
  logTitle('Environment Variables');
  
  console.log(colorize('  PUSHSCRIPT_LLM_PROVIDER', 'yellow') + ' - LLM provider (openai, groq, anthropic, gemini)');
  console.log(colorize('  OPENAI_API_KEY', 'yellow') + ' - OpenAI API key');
  console.log(colorize('  GROQ_API_KEY', 'yellow') + ' - Groq API key');
  console.log(colorize('  ANTHROPIC_API_KEY', 'yellow') + ' - Anthropic API key');
  console.log(colorize('  GEMINI_API_KEY', 'yellow') + ' - Gemini API key');
  console.log(colorize('  PUSHSCRIPT_LLM_API_KEY', 'yellow') + ' - Generic API key (fallback)');
  
  logTitle('Examples');
  
  console.log(colorize('  $ npm run push', 'cyan'));
  console.log(colorize('  $ npm run commit', 'cyan'));
  
  console.log('');
} 