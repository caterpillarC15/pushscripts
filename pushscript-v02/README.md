# PushScript

An enhanced Git workflow automation tool that simplifies commits and pushes with AI-powered commit message generation, dependency conflict detection, and security scanning.

## Features

- **Multi-Provider AI Commit Generation**: Supports multiple AI providers including Groq, OpenAI, Anthropic, and Gemini
- **Flexible Model Selection**: 
  - Uses provider's default model if no model specified (recommended)
  - Supports explicit model selection when needed
  - Works with just an API key for simplicity and future compatibility
- **AI-Powered Dependency Conflict Resolution**: 
  - Detects conflicts in package dependencies through multiple strategies
  - Uses AI to analyze complex dependency issues and provide tailored resolution advice
  - Performs recursive dependency tree validation
  - Identifies peer dependency conflicts via dry-run installation checks
  - Detects duplicate packages and version inconsistencies
- **Vulnerability Scanning**: Basic security scanning for known vulnerabilities in dependencies
- **Sensitive File Protection**: Prevents accidental commit of sensitive files like `.env`
- **Conventional Commits**: Ensures proper formatting following conventional commit standards
- **Interactive Confirmations**: User-friendly prompts for confirming actions
- **Color-Coded Output**: Improved readability with color-coded console messages

## Installation

1. Make sure you have Node.js installed
2. Add these scripts to your `package.json`:

```json
"scripts": {
  "push": "node scripts/push-scripts.js",
  "commit": "node scripts/push-scripts.js commit",
  "pushscript": "node scripts/pushscript/cli.js"
}
```

## Configuration

Create a `.env.local` file (or `.env`) with your preferred AI provider configuration:

```
# Provider to use (groq, openai, anthropic, gemini)
PUSHSCRIPT_LLM_PROVIDER=gemini

# API key for the selected provider (provider-specific variables preferred)
GEMINI_API_KEY=AIza...your-key-here...

# Alternative: Generic API key (avoid setting this to a provider name)
# PUSHSCRIPT_LLM_API_KEY=your-key-here

# Optional: Model selection
# Provider-specific (recommended):
# GROQ_PUSHSCRIPT_MODEL=llama-3.3-70b-versatile
# OPENAI_PUSHSCRIPT_MODEL=gpt-4o
# ANTHROPIC_PUSHSCRIPT_MODEL=claude-3.7-sonnet
# GEMINI_PUSHSCRIPT_MODEL=gemini-2.0-pro

# Or generic (fallback):
# PUSHSCRIPT_LLM_MODEL=provider-specific-model-name
```

## Provider Defaults and Requirements

| Provider | Default Model | Requirements |
|----------|---------------|-------------|
| groq | llama-3.3-70b-versatile | Requires `model` parameter in requests (will use default if not specified) |
| openai | gpt-4o | Requires `model` parameter in requests (will use default if not specified) |
| anthropic | claude-3.7-sonnet | Requires `model` parameter in requests (will use default if not specified) |
| gemini | gemini-2.0-flash | Requires model name in URL path, will use default if not specified |

**Note:** While most providers have an official default model, their APIs may still require explicitly setting the model parameter in the request. Our implementation handles this automatically by using the specified defaults when needed.

### Gemini Model Options

Gemini model availability changes frequently. Some current options include:
- `gemini-2.0-flash` (default, stable option with good performance)
- `gemini-2.0-flash-lite` (lightweight version)
- `gemini-2.0-flash-vision` (includes image processing capabilities)
- `gemini-2.5-pro-experimental-03-25` (experimental pro version)

If you encounter a "model not found" error, you can use the included utility script to list currently available models:

```bash
# Run the model listing utility
node scripts/list-gemini-models.js
```

This will show all available Gemini models and recommend the most appropriate one for your use case.