# Tools Overview

Bedrock Engineer's Agent Chat provides a rich set of tools that enable agents to perform various tasks. This document provides an overview of available tools and how to configure them for your agents.

## Tool Categories

The tools available in Agent Chat are organized into four main categories:

1. **File System Operations**: Tools for working with files and folders
2. **Web & Search Operations**: Tools for searching the web and retrieving content from websites
3. **Amazon Bedrock Integration**: Tools that leverage Amazon Bedrock services
4. **System Command & Code Execution**: Tools for running system commands and code

## Configuring Tools for Agents

Each agent can have its own set of enabled tools, allowing you to create specialized agents with specific capabilities.

To configure tools for an agent:

1. Navigate to the Agent Chat interface
2. Click the Tools icon in the bottom left corner
3. Select or deselect tools to enable or disable them for the current agent
4. (Optional) Configure tool-specific settings if available

![Selecting Tools](../../assets/select-tools.png)

## Tool Selection Strategies

When deciding which tools to enable for an agent, consider:

### Purpose-Driven Selection

Enable only the tools that align with the agent's intended purpose:

- For development agents: File system tools and code execution
- For research agents: Web search tools
- For data analysis agents: Code interpreter with data science libraries
- For content creation: Image and video generation tools

### Security Considerations

Some tools provide more extensive system access than others:

- System Command Execution tools should be enabled only when necessary
- Consider restricting file system access for general-purpose agents
- Configure allowed commands when using the executeCommand tool

### Performance Optimization

Tool configuration can affect agent performance:

- Enabling too many tools can slow down decision-making
- Some tools require additional API credentials or quotas
- Heavy tools like video generation may have cost implications

## Tool Permissions

Some tools require specific permissions or credentials:

- **Web Search**: Requires a Tavily API key
- **Amazon Bedrock Integration**: Requires appropriate AWS permissions
- **System Commands**: May require OS-level permissions
- **Screen/Camera Capture**: Requires appropriate system permissions

## Customizing Tool Behavior

For certain tools, you can customize their behavior through configuration:

- **File System Operations**: Configure ignore patterns for file listings
- **Web Search**: Set search depth and result count
- **Code Interpreter**: Select environment type (basic vs. datascience)
- **Image/Video Generation**: Configure default models and parameters

## Tool Availability by Agent Type

Different agent types have different default tool configurations:

| Agent Type | File System | Web Search | Bedrock Integration | Code Execution |
|------------|-------------|------------|---------------------|----------------|
| Software Developer | ✅ | ✅ | ⚪ | ✅ |
| Programming Mentor | ✅ | ✅ | ⚪ | ✅ |
| Product Designer | ⚪ | ✅ | ✅ | ⚪ |
| Custom Agent | Configurable | Configurable | Configurable | Configurable |

## Further Reading

For detailed information about specific tool categories, refer to:

- [File System Operations](./tools/file-system.md)
- [Web & Search Operations](./tools/web-search.md)
- [Amazon Bedrock Integration](./tools/bedrock-integration.md)
- [System Command & Code Execution](./tools/system-execution.md)