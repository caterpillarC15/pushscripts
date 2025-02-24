const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const readline = require('readline')

// Load environment variables
require('dotenv').config()

const GROQ_API_KEY = process.env.GROQ_API_KEY

// Examples of good commit messages for different types of changes
const COMMIT_EXAMPLES = {
  feat: [
    'feat(ui): add new participant selection interface',
    'feat(api): implement OpenAI streaming response',
    'feat(debate): add turn-based conversation flow'
  ],
  fix: [
    'fix(layout): resolve sidebar overflow issues',
    'fix(auth): handle expired token refresh',
    'fix(stats): correct participant message counting'
  ],
  style: [
    'style(components): improve spacing in debate flow',
    'style(ui): update color scheme for better contrast',
    'style(layout): refine padding and margins'
  ],
  refactor: [
    'refactor(state): simplify conversation management',
    'refactor(components): extract shared logic to hooks',
    'refactor(types): reorganize shared interfaces'
  ],
  docs: [
    'docs(readme): update setup instructions',
    'docs(api): add JSDoc comments to core functions',
    'docs(components): document prop types'
  ]
}

function getGitStatus() {
  const status = execSync('git status --porcelain').toString()
  return status
    .split('\n')
    .filter(line => line.length > 0)
    .map(line => ({
      status: line.slice(0, 2).trim(),
      file: line.slice(3)
    }))
}

function categorizeChanges(changes) {
  const categories = {
    added: [],
    modified: [],
    deleted: [],
    renamed: [],
    components: new Set(),
    features: new Set()
  }

  changes.forEach(change => {
    // Extract component/feature name from path
    const pathParts = change.file.split('/')
    if (pathParts.includes('components')) {
      const componentIndex = pathParts.indexOf('components')
      if (pathParts[componentIndex + 1]) {
        categories.components.add(pathParts[componentIndex + 1])
      }
    }
    if (pathParts.includes('features')) {
      const featureIndex = pathParts.indexOf('features')
      if (pathParts[featureIndex + 1]) {
        categories.features.add(pathParts[featureIndex + 1])
      }
    }

    // Categorize by change type
    if (change.status.includes('A')) categories.added.push(change.file)
    else if (change.status.includes('M')) categories.modified.push(change.file)
    else if (change.status.includes('D')) categories.deleted.push(change.file)
    else if (change.status.includes('R')) categories.renamed.push(change.file)
  })

  return categories
}

function generateCommitMessage(changes) {
  const categories = categorizeChanges(changes)
  
  console.log(`\nChanges: ${changes.length} files (${categories.modified.length} modified, ${categories.added.length} added, ${categories.deleted.length} deleted)`)
  
  let type = 'chore'
  let scope = ''
  let description = ''

  // Determine if this is primarily modifications or additions
  const isMainlyModifications = categories.modified.length > categories.added.length

  if (isMainlyModifications) {
    if (categories.modified.some(f => f.includes('style') || f.includes('css'))) {
      type = 'style'
      description = 'update styling'
    } else if (categories.components.size > 0) {
      type = 'fix'
      scope = 'ui'
      description = 'update components'
    } else {
      type = 'fix'
      description = 'update implementation'
    }
  } else if (categories.added.length > 0) {
    type = 'feat'
    if (categories.components.size === 1) {
      scope = 'ui'
      description = `add ${Array.from(categories.components)[0]}`
    } else {
      description = 'add new features'
    }
  }

  const message = scope ? `${type}(${scope}): ${description}` : `${type}: ${description}`
  console.log('Commit:', message)
  
  return message
}

function checkSensitiveFiles() {
  // List of sensitive files and patterns to check
  const sensitivePatterns = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.test',
    'credentials.json',
    'secrets.json'
  ]

  // Get the git status
  const status = execSync('git status --porcelain').toString()
  const stagedFiles = status
    .split('\n')
    .filter(line => line.length > 0)
    .map(line => line.slice(3))

  // Check each staged file against sensitive patterns
  const sensitiveFiles = stagedFiles.filter(file =>
    sensitivePatterns.some(pattern => file.includes(pattern))
  )

  if (sensitiveFiles.length > 0) {
    console.error('\x1b[31mError: Attempting to commit sensitive files:\x1b[0m')
    sensitiveFiles.forEach(file => console.error(`- ${file}`))
    console.error('\nPlease remove these files from git:')
    console.error('1. Add them to .gitignore')
    console.error('2. Run: git rm --cached <file>')
    process.exit(1)
  }
}

async function generateAICommitMessage(changes) {
  if (!GROQ_API_KEY) {
    console.log('\x1b[33mNo Groq API key found, falling back to standard message generation\x1b[0m')
    return generateCommitMessage(changes)
  }

  try {
    const categories = categorizeChanges(changes)
    
    // Create a detailed description of changes
    const changesDescription = [
      `Modified files: ${categories.modified.join(', ')}`,
      `Added files: ${categories.added.join(', ')}`,
      `Deleted files: ${categories.deleted.join(', ')}`,
      `Components affected: ${Array.from(categories.components).join(', ')}`,
      `Features affected: ${Array.from(categories.features).join(', ')}`
    ].filter(line => !line.endsWith(': ')).join('\n')

    // Get git diff for context
    const diff = execSync('git diff --staged').toString()

    const prompt = `As a Git commit message expert, analyze these changes and generate a clear, informative commit message following conventional commits format.

Changes Overview:
${changesDescription}

Key points:
1. Use format: type(scope): description
2. Types: feat, fix, docs, style, refactor, test, chore
3. Keep first line under 72 chars
4. Be specific but concise
5. Focus on WHY and WHAT, not HOW
6. Use imperative mood ("add" not "added")

Generate a commit message that best describes these changes.`

    const response = await fetch('https://api.groq.com/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama2-70b-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a Git commit message expert that generates clear, concise, and informative commit messages following conventional commits format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const data = await response.json()
    const message = data.choices[0].message.content.trim()
    
    // Validate the message format
    if (!/^(feat|fix|docs|style|refactor|test|chore)(\([a-z-]+\))?: .+/.test(message)) {
      console.log('\x1b[33mAI generated message does not match conventional format, falling back to standard generation\x1b[0m')
      return generateCommitMessage(changes)
    }

    console.log('\x1b[32mAI Generated Commit Message:\x1b[0m', message)
    return message

  } catch (error) {
    console.log('\x1b[33mError generating AI commit message, falling back to standard generation:\x1b[0m', error.message)
    return generateCommitMessage(changes)
  }
}

async function confirmPush(commitMessage) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  // Show the commit message and changes
  console.log('\n\x1b[36mCommit Message:\x1b[0m')
  console.log('\x1b[37m' + commitMessage + '\x1b[0m')
  
  // Show git diff --stat for a summary of changes
  console.log('\n\x1b[36mChanges to be pushed:\x1b[0m')
  console.log('\x1b[37m' + execSync('git diff --cached --stat').toString() + '\x1b[0m')

  return new Promise((resolve) => {
    rl.question('\x1b[33mProceed with push? (Y/n): \x1b[0m', (answer) => {
      rl.close()
      // If empty or 'y' or 'Y', proceed
      resolve(answer.toLowerCase() !== 'n')
    })
  })
}

async function gitPush(message, branch = 'main') {
  try {
    // Check for sensitive files before doing anything
    checkSensitiveFiles()

    // Add all changes
    console.log('\x1b[34mAdding changes...\x1b[0m')
    execSync('git add .')

    // Double-check again after git add
    checkSensitiveFiles()

    // Get status and generate commit message if none provided
    const changes = getGitStatus()
    const commitMessage = message || await generateAICommitMessage(changes)

    // Get confirmation before proceeding
    const shouldProceed = await confirmPush(commitMessage)
    
    if (!shouldProceed) {
      console.log('\x1b[33mPush cancelled by user\x1b[0m')
      process.exit(0)
    }

    // Commit with message
    console.log('\x1b[34mCommitting changes...\x1b[0m')
    execSync(`git commit -m "${commitMessage}"`)

    // Push to remote
    console.log(`\x1b[34mPushing to ${branch}...\x1b[0m`)
    execSync(`git push origin ${branch}`)

    console.log('\x1b[32mSuccessfully pushed to GitHub!\x1b[0m')
  } catch (error) {
    console.error('\x1b[31mError pushing to GitHub:\x1b[0m', error)
    process.exit(1)
  }
}

// If running directly (not imported)
if (require.main === module) {
  const args = process.argv.slice(2)
  const message = args[0]
  const branch = args[1]
  
  gitPush(message, branch).catch(error => {
    console.error('\x1b[31mError:\x1b[0m', error)
    process.exit(1)
  })
}

module.exports = gitPush 