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

# Set up your API key (choose one)
echo "OPENAI_API_KEY=your-api-key" > ~/.pushscripts-rc
# or
echo "GROQ_API_KEY=your-api-key" > ~/.pushscripts-rc
```

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
LLM_PROVIDER=openai  # or 'groq'

# Optional: Customize model and settings
COMMIT_MESSAGE_MODEL=gpt-3.5-turbo  # OpenAI model
# or
COMMIT_MESSAGE_MODEL=llama2-70b-chat  # Groq model

COMMIT_MESSAGE_TEMPERATURE=0.3  # Lower = more focused
```

### Supported LLM Providers 🤖

PushScripts supports multiple LLM providers for generating commit messages:

1. **OpenAI** (default)
   - Models: gpt-3.5-turbo, gpt-4, etc.
   - Set `LLM_PROVIDER=openai` and `OPENAI_API_KEY`

2. **Groq**
   - Models: llama2-70b-chat, mixtral-8x7b-chat, etc.
   - Set `LLM_PROVIDER=groq` and `GROQ_API_KEY`

Choose the provider and model that best fits your needs and budget.

## Development 🛠️

```bash
# Clone the repository
git clone https://github.com/caterpillarC15/pushscripts.git

# Install dependencies
cd pushscripts
pnpm install

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
1. Check the [documentation](https://caterpillarC15.github.io/pushscripts)
2. Open an issue
3. Join our GitHub discussions

## Acknowledgments 🙏

- [Groq](https://groq.com) for their powerful LLM API
- The open-source community for inspiration and support

---
Made with ❤️ by [Your Name] 