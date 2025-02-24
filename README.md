# PushScripts 🚀

> Ship code faster with AI-powered git commands

PushScripts supercharges your git workflow with AI. Stop writing commit messages manually - let AI analyze your changes and craft perfect, conventional commits while you focus on coding. The AI understands your code changes and generates meaningful, standardized commit messages that follow best practices.

## Features ✨

- 🧠 **AI-First Design**: Leverages OpenAI or Groq to deeply understand your code changes and generate perfect commit messages
- 🚀 **Zero Config Required**: Works immediately with basic commit messages, seamlessly upgrades to AI when you're ready
- 📝 **Smart Commits**: Analyzes code context, detects components, and generates meaningful conventional commit messages
- ⚡ **Developer Flow**: Focus on coding while AI handles the documentation overhead
- 🔒 **Security First**: Automatic detection of sensitive files and environment variables
- 🎯 **Context Aware**: Understands your project structure, components, and features for better commit messages
- 🔄 **Provider Flexibility**: Choose between OpenAI and Groq, with smart fallbacks if AI is unavailable
- 💡 **Best Practices**: Enforces conventional commit format and git workflow standards

## Quickstart 🚀

1. **Install globally:**
```bash
pnpm add -g pushscripts
```

2. **Start using immediately:**
```bash
# Works out of the box with basic commit messages
push  # or 'commit' if you don't want to push
```

3. **Enable AI features (recommended):**
```bash
# Choose your preferred AI provider in your environment
PUSHSCRIPTS_MODEL_PROVIDER=openai
# Add your API key
OPENAI_API_KEY=your-key-here
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

PushScripts works without any configuration, but you can enable AI-powered commits by setting up a provider:

```bash
# Optional: Enable AI-powered commits by choosing a provider
PUSHSCRIPTS_MODEL_PROVIDER=openai  # if using OpenAI
# or
PUSHSCRIPTS_MODEL_PROVIDER=groq    # if using Groq

# And adding the corresponding API key:
# - OPENAI_API_KEY for OpenAI
# - GROQ_API_KEY for Groq
```

### Advanced Configuration 🛠️

Additional settings are available but completely optional:

```bash
# Optional: Customize model selection
PUSHSCRIPTS_MODEL=gpt-4-turbo-preview  # For OpenAI
# or
PUSHSCRIPTS_MODEL=mixtral-8x7b-chat    # For Groq

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

   # Your custom patterns
   **/*secret*
   *.key
   private/*.conf
   config/*.secret.json
   
   # Supports standard gitignore patterns:
   # - Use * to match any characters except /
   # - Use ** to match any characters including /
   # - Lines starting with ! negate the pattern
   # - Lines starting with # are comments
   ```

2. **Using Environment Variable** (For quick overrides):
   ```bash
   # Add patterns (comma-separated)
   PUSHSCRIPTS_SENSITIVE_FILES=**/*secret*,*.key

   # Or override defaults (prefix with override:)
   PUSHSCRIPTS_SENSITIVE_FILES=override:**/*.pem,**/id_rsa
   ```

The `.gitignore-sensitive` approach is recommended because:
- Familiar gitignore syntax
- Can include comments
- Version controllable (share with team)
- Easier to maintain long lists
- More readable format

### Supported LLM Providers 🤖

1. **OpenAI**
   - Set `PUSHSCRIPTS_MODEL_PROVIDER=openai`
   - Requires `OPENAI_API_KEY` in your environment
   - Default model: gpt-4-turbo-preview

2. **Groq**
   - Set `PUSHSCRIPTS_MODEL_PROVIDER=groq`
   - Requires `GROQ_API_KEY` in your environment
   - Default model: mixtral-8x7b-chat

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

- [OpenAI](https://openai.com) and [Groq](https://groq.com) for their powerful LLM APIs
- The open-source community for inspiration and support

---
Made with ❤️ by the PushScripts Team