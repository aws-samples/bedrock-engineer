# Ben CLI - Bedrock Engineer Command Line Interface

Ben is the command-line interface for Bedrock Engineer, providing autonomous AI development assistance directly from your terminal.

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/aws-samples/bedrock-engineer.git
cd bedrock-engineer
```

2. Install dependencies:
```bash
npm install
```

3. Build the CLI:
```bash
npm run build:cli
```

4. Test the CLI:
```bash
node dist/cli/cli/index.js test
```

### Global Installation (Future)

Once published, you'll be able to install globally:
```bash
npm install -g bedrock-engineer-cli
ben --help
```

## Quick Start

### 1. Test Installation
```bash
ben test
```

### 2. Basic Commands
```bash
# Say hello
ben hello -n "Developer"

# List available agents
ben agent

# Show configuration options
ben config
```

## Available Commands

### `ben test`
Test CLI functionality and verify installation.

### `ben hello [options]`
Simple greeting command for testing.

**Options:**
- `-n, --name <name>` - Name to greet (default: "World")

**Example:**
```bash
ben hello -n "Alice"
```

### `ben agent`
Agent management commands (basic version).

Shows available AI agents:
- Software Developer
- Programming Mentor
- Product Designer

**Future Features:**
- `ben agent list` - List all agents
- `ben agent show <name>` - Show agent details
- `ben agent create` - Create custom agent

### `ben config`
Configuration management (basic version).

Shows available configuration commands:
- `init` - Initialize configuration
- `show` - Show current configuration
- `setup` - Run setup wizard

**Future Features:**
- `ben config setup` - Interactive setup wizard
- `ben config set <key> <value>` - Set configuration values
- `ben config get <key>` - Get configuration values

## Future Features

The current version is a basic foundation. Future releases will include:

### Chat Commands
```bash
# Quick chat with an agent
ben chat -a "Software Developer" -p "Create a React component"

# Interactive chat session
ben interactive -a "Software Developer"
```

### Advanced Agent Management
```bash
# List all agents with details
ben agent list --verbose

# Show specific agent
ben agent show "Software Developer"

# Create custom agent
ben agent create --name "My Agent" --system "You are..."

# Export/Import agents
ben agent export "My Agent" -o my-agent.yaml
ben agent import my-agent.yaml
```

### Configuration Management
```bash
# Setup wizard for first-time users
ben config setup

# Manage AWS credentials
ben config set aws.region us-east-1
ben config set aws.profile default

# Project settings
ben config set project.path /path/to/project
```

### Tool Integration
- File system operations
- Web search capabilities
- AWS Bedrock integrations
- Code execution
- Image generation and recognition

## Architecture

Ben CLI is designed with a modular architecture:

- **CLI Core** - Command parsing and execution
- **Agent Manager** - AI agent management and execution
- **Tool Registry** - Extensible tool system
- **Configuration Service** - Settings and preferences
- **Session Management** - Conversation history and context

## Development

### Building the CLI
```bash
npm run build:cli
```

### Running in Development
```bash
npm run ben -- test
```

### TypeScript Configuration
The CLI uses a separate TypeScript configuration (`tsconfig.cli.json`) to avoid conflicts with the main Electron application.

## Contributing

Contributions are welcome! Please see the main project's [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT-0 License. See the [LICENSE](./LICENSE) file for details.

## Support

For issues and questions:
- Create an issue on [GitHub](https://github.com/aws-samples/bedrock-engineer/issues)
- Check the main project's [README](./README.md) for more information

---

**Note:** This is an early version of Ben CLI. Many features are still in development. The CLI is designed to complement the main Bedrock Engineer GUI application, providing a lightweight command-line alternative for developers who prefer terminal-based workflows.