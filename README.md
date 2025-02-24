# PushScripts 🚀

> Ship code faster with AI-powered git commands

PushScripts supercharges your git workflow with AI. Stop writing commit messages manually - let AI analyze your changes and craft perfect, conventional commits while you focus on coding.

## Features ✨

- 🧠 **AI-Powered**: Smart commit messages that understand your code changes
- ⚡ **Save Time**: Focus on coding, let AI handle the git documentation
- 📝 **Professional Commits**: Perfect conventional commit format every time
- 🔒 **Security First**: Automatic sensitive file detection
- 🚀 **Dead Simple**: Just use `push` instead of `git push`

## Installation 📦

```bash
# Install globally via pnpm (recommended)
pnpm add -g pushscripts

# Set up your API key
echo "GROQ_API_KEY=your-api-key" > ~/.pushscripts-rc
```

## Usage 🚀

Replace `git push` with just `push`:

```bash
# Stage your changes
git add .

# Let AI handle the rest
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
# You: Make some changes and stage them
git add .
push

# PushScripts: Analyzes and generates perfect commit
✓ "feat(auth): implement OAuth2 login with role-based access"
```

## Configuration ⚙️

Create a `.pushscripts-rc` file in your home directory:

```bash
GROQ_API_KEY=your-api-key
```

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

We maintain two main branches:
- `main`: Production-ready code
- `develop`: Development and feature integration

Development Workflow:
1. All new features should be developed on `develop` branch
2. Create feature branches from `develop` for specific features
3. Development-only files (branding/, devdocs.md) should stay in `develop`
4. When ready for release, merge `develop` into `main`

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
1. Check the [documentation](https://yourusername.github.io/pushscripts)
2. Open an issue
3. Join our GitHub discussions

## Acknowledgments 🙏

- [Groq](https://groq.com) for their powerful LLM API
- The open-source community for inspiration and support

---
Made with ❤️ by [Your Name] 