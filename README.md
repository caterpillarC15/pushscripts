<div align="center">
  <a href="https://pushscripts.web.app">
    <img src="website/assets/images/logo.svg" alt="PushScripts Logo" width="400" />
  </a>

  <p align="center">
    <span>Website (Coming Soon)</span>
    ·
    <a href="https://github.com/caterpillarC15/pushscripts/issues">Report Bug</a>
    ·
    <a href="https://github.com/caterpillarC15/pushscripts/issues">Request Feature</a>
  </p>
</div>

> Ship code faster with AI-powered git commands

PushScripts is an open-source tool that supercharges your git workflow with AI. No more writing commit messages manually - let AI analyze your changes and craft perfect, conventional commits while you focus on coding. Built by developers for developers, PushScripts is designed to be lightweight, secure, and completely free to use. It works out of the box with basic commit messages and seamlessly upgrades to AI-powered commits when you're ready.

## Features ✨

- **AI-First Design**: Uses your preferred AI provider to deeply understand your code changes and generate perfect commit messages
- **Zero Config Required**: Works immediately with basic commit messages, seamlessly upgrades to AI when you're ready
- **Smart Commits**: Analyzes code context, detects components, and generates meaningful conventional commit messages
- **Developer Flow**: Focus on coding while AI handles the documentation overhead
- **Security First**: Automatic detection of sensitive files and environment variables
- **Context Aware**: Understands your project structure, components, and features for better commit messages
- **Provider Flexibility**: Use any supported AI provider, with smart fallbacks if AI is unavailable
- **Best Practices**: Enforces conventional commit format and git workflow standards

## Quickstart

1. **Choose your installation:**
```bash
# Option A: Install globally (recommended for personal use)
pnpm add -g pushscripts
# The commands 'push' and 'commit' will be available directly in your terminal

# Option B: Install locally (recommended for team projects)
pnpm add -D pushscripts
# For local installation, add to package.json scripts:
{
  "scripts": {
    "push": "pushscripts push",
    "commit": "pushscripts commit"
  }
}
```

2. **Start using immediately:**
```bash
# If installed globally (Option A):
push            # commit and push changes
commit          # only commit changes

# If installed locally (Option B):
pnpm push       # commit and push changes
pnpm commit     # only commit changes
```

3. **Enable AI features (recommended):**
```bash
# Example 1: Using OpenAI
# First, set your API key
OPENAI_API_KEY=your-key-here
# Then configure PushScripts
PUSHSCRIPTS_MODEL_PROVIDER=openai
PUSHSCRIPTS_MODEL=gpt-4-turbo-preview  # optional

# Example 2: Using Anthropic
# First, set your API key
ANTHROPIC_API_KEY=your-key-here
# Then configure PushScripts
PUSHSCRIPTS_MODEL_PROVIDER=anthropic
PUSHSCRIPTS_MODEL=claude-3-opus  # optional
```

4. **Enjoy smart commits:**
```bash
push

# PushScripts will now:
# 1. Add all changes (git add .)
# 2. Analyze your changes with AI
# 3. Generate a perfect conventional commit
# 4. Show you for review
# 5. Commit and push when approved
```

That's it! PushScripts is now supercharging your git workflow. It works without AI configuration, but we recommend setting up AI features to get the full experience.

## Usage 🚀

Replace `git push` with `push` and `git commit` with `commit`:

```bash
# Option 1: Generate commit message and commit
commit

# Option 2: Generate commit message, commit, and push
push
```

PushScripts will:
1. Add all changes automatically
2. Check for sensitive files
3. Analyze your changes
4. Generate a professional commit message
5. Show you for review
6. Commit and push when approved

## Examples 📝

```bash
# Example 1: Commit only
commit

# PushScripts: Analyzes and generates commit
✓ "feat(auth): implement OAuth2 login with role-based access"
✓ Changes committed successfully!

# Example 2: Commit and push
push

# PushScripts: Analyzes, commits, and pushes
✓ "feat(api): add user authentication endpoints"
✓ Changes committed and pushed successfully!
```

## Configuration ⚙️

PushScripts works without any configuration, but you can enable AI-powered commits by setting up your preferred provider:

```bash
# Optional: Enable AI-powered commits by setting your provider
PUSHSCRIPTS_MODEL_PROVIDER=your_provider

# And adding your provider's API key:
YOUR_PROVIDER_API_KEY=your-key-here
```

### Advanced Configuration 🛠️

Additional settings are available but completely optional:

```bash
# Optional: Customize model selection for your provider
PUSHSCRIPTS_MODEL=your-preferred-model

# Optional: Fine-tune generation
PUSHSCRIPTS_TEMPERATURE=0.3  # Lower = more focused

# Optional: Enable debug mode
DEBUG=pushscripts:*
```

### Sensitive File Detection 🔒

PushScripts prevents committing sensitive files by default (like `.env`, `credentials.json`). You can customize this in two ways:

1. **Using .gitignore-sensitive** (Recommended):
   Create a `.gitignore-sensitive` file in your project root:
   ```gitignore
   # Default patterns (already included)
   .env
   .env.*
   credentials.json
   secrets.json

   # Block specific file types
   *.key
   *.pem
   *.cert
   **/secrets/**
   private/*.conf

   # Allow exceptions with ! prefix
   !*.pub.key
   !example.cert
   !**/secrets/public/**
   !private/example.conf

   # Block specific directories but allow examples
   config/secure/*
   !config/secure/*.example.json

   # Supports standard gitignore patterns:
   # - Use * to match any characters except /
   # - Use ** to match any characters including /
   # - Start with ! to exclude from sensitive list
   # - Lines starting with # are comments
   ```

2. **Using Environment Variable** (For quick overrides):
   ```bash
   # Add patterns (comma-separated)
   PUSHSCRIPTS_SENSITIVE_FILES=*.key,private/*.conf,!*.pub.key

   # Or override defaults completely
   PUSHSCRIPTS_SENSITIVE_FILES=override:**/*.pem,**/id_rsa,!id_rsa.pub
   ```

The `.gitignore-sensitive` approach is recommended because:
- Familiar gitignore syntax
- Can include comments
- Version controllable (share with team)
- Easier to maintain long lists
- More readable format
- Supports complex pattern matching
- Allows fine-grained control with negation patterns

**Pattern Matching Examples:**
```gitignore
# Block all .key files except public keys
*.key
!*.pub.key

# Block entire secrets directory except public files
secrets/**/*
!secrets/public/**/*

# Block config files but allow examples
config/*.json
!config/*.example.json

# Block deep credential files
**/credentials/**/*.json
!**/credentials/**/*.public.json

# Block specific formats in any directory
**/*.secret.*
**/*.private.*
!**/*.example.*
```

When a sensitive file is detected, PushScripts will:
1. Stop the commit process
2. Show which files were flagged as sensitive
3. Provide instructions for handling sensitive files

### Supported AI Providers 🤖

PushScripts supports various AI providers through a flexible integration system. Choose the provider that best fits your needs:

1. **Default Providers**
   - Set `PUSHSCRIPTS_MODEL_PROVIDER` to your chosen provider
   - Add the corresponding API key to your environment
   - Each provider may have different default models and capabilities

2. **Provider Configuration**
   - Configure model selection with `PUSHSCRIPTS_MODEL`
   - Adjust temperature and other settings as needed
   - Fallback to basic commit messages if AI is unavailable

Check our [documentation](https://www.pushscripts.com) for the latest list of supported providers and their specific configuration options.

## Development 🛠️

```bash
# Clone the repository
git clone https://github.com/caterpillarC15/pushscripts.git

# Install dependencies
cd pushscripts
pnpm install

# Create your .env file
cp .env.example .env
# Edit .env with your API key

# Run in development mode
pnpm run dev
```

### Branch Structure 🌳

We maintain a single main branch:
- `main`: Production and development code

Development Workflow:
1. Create feature branches from `main` for new features
2. Submit pull requests to merge changes back into `main`
3. Keep commits clean and conventional using PushScripts
4. Ensure all tests pass before merging

### Project Structure 📁

```
pushscripts/
├── src/
│   ├── core/
│   │   ├── index.js     # Core functionality
│   │   └── cli.js       # CLI interface
│   └── website/         # Documentation website
├── docs/               # Additional documentation
└── README.md
```

## Contributing 🤝

Contributions welcome! Feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you'd like to change.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 💬

Need help? We've got you:
1. Check the [documentation](https://github.com/caterpillarC15/pushscripts)
2. Open an issue
3. Join our GitHub discussions

## Acknowledgments 🙏

- The AI provider community for their powerful language models
- The open-source community for inspiration and support

---
Made with ❤️ by the PushScripts Team