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
# Install globally via pnpm (recommended)
pnpm add -g pushscripts

# Create a .env file in your project (recommended)
cp .env.example .env
# Edit .env with your API key

# Or set up globally (alternative)
echo "OPENAI_API_KEY=your-api-key" > ~/.pushscripts-rc
# or for Groq
echo "GROQ_API_KEY=your-api-key" > ~/.pushscripts-rc
```

The `.env` file takes precedence over the global configuration. This allows you to use different settings per project.

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

Create a `.pushscripts-rc` file in your home directory or a `.env` file in your project:

```bash
# Required: Your API key (choose one)
OPENAI_API_KEY=your-api-key
# or
GROQ_API_KEY=your-api-key

# Optional: Choose your LLM provider
PUSHSCRIPTS_MODEL_PROVIDER=openai  # or 'groq'

# Optional: Customize model and settings
PUSHSCRIPTS_MODEL=gpt-4-turbo-preview  # OpenAI model (default)
# or
PUSHSCRIPTS_MODEL=mixtral-8x7b-chat  # Groq model (default)

PUSHSCRIPTS_TEMPERATURE=0.3  # Lower = more focused

# Optional: Enable debug mode
DEBUG=pushscripts:*
```

### Supported LLM Providers 🤖

PushScripts supports multiple LLM providers for generating commit messages:

1. **OpenAI** (default)
   - Models: gpt-4-turbo-preview (default), gpt-4, gpt-3.5-turbo
   - Set `PUSHSCRIPTS_MODEL_PROVIDER=openai` and `OPENAI_API_KEY`

2. **Groq**
   - Models: mixtral-8x7b-chat (default), llama2-70b-chat
   - Set `PUSHSCRIPTS_MODEL_PROVIDER=groq` and `GROQ_API_KEY`

Choose the provider and model that best fits your needs and budget.

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