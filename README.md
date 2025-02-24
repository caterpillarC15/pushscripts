# PushScripts 🚀

> Ship code faster with AI-powered git commands

PushScripts supercharges your git workflow with AI. Stop writing commit messages manually - let AI analyze your changes and craft perfect, conventional commits while you focus on coding. The AI understands your code changes and generates meaningful, standardized commit messages that follow best practices.

## Features ✨

- 🧠 **AI-Powered**: Smart commit messages that understand your code changes
- ⚡ **Save Time**: Focus on coding, let AI handle the git documentation
- 📝 **Professional Commits**: Perfect conventional commit format every time
- 🔒 **Security First**: Automatic sensitive file detection
- 🚀 **Dead Simple**: Just use `push` instead of `git push` and `commit` instead of `git commit`
- 🔄 **Flexible**: Support for multiple LLM providers (OpenAI, Groq)

## Installation 📦

```bash
# Install globally via pnpm
pnpm add -g pushscripts
```

Before using PushScripts:
1. Choose your provider by setting `PUSHSCRIPTS_MODEL_PROVIDER` to either `openai` or `groq` in your environment
2. Make sure you have the corresponding API key (`OPENAI_API_KEY` or `GROQ_API_KEY`) in your environment

You can add these to your `.env` file or your shell's configuration file (`.bashrc`, `.zshrc`, etc.).

## Usage 🚀

Replace `git push` with `push` and `git commit` with `commit`:

```bash
# Stage your changes
git add .

# Option 1: Generate commit message and commit
commit

# Option 2: Generate commit message, commit, and push
push
```

PushScripts will:
1. Check for sensitive files
2. Analyze your changes
3. Generate a professional commit message
4. Show you for review
5. Commit and push when approved

## Examples 📝

```bash
# Example 1: Commit only
git add .
commit

# PushScripts: Analyzes and generates commit
✓ "feat(auth): implement OAuth2 login with role-based access"
✓ Changes committed successfully!

# Example 2: Commit and push
git add .
push

# PushScripts: Analyzes, commits, and pushes
✓ "feat(api): add user authentication endpoints"
✓ Changes committed and pushed successfully!
```

## Configuration ⚙️

Tell PushScripts which provider to use:

```bash
# Choose your provider (required)
PUSHSCRIPTS_MODEL_PROVIDER=openai  # if using OpenAI
# or
PUSHSCRIPTS_MODEL_PROVIDER=groq    # if using Groq

# PushScripts will look for the corresponding API key:
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

## Project Structure 📁

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