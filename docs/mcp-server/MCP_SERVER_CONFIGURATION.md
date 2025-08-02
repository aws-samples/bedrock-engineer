# MCP Server Configuration

Model Context Protocol (MCP) client integration allows Bedrock Engineer to connect to external MCP servers and dynamically load and use powerful external tools. This integration extends the capabilities of your AI assistant by allowing it to access and utilize the tools provided by the MCP server.

## Configuration Formats

MCP servers can be configured using the Claude Desktop-compatible `claude_desktop_config.json` format. Configuration can be done from the "MCP Servers" section in the agent edit modal.

MCP servers can be configured in two formats:

### 1. Command Format (Local Servers)

```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-to-run",
      "args": ["arg1", "arg2"],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

### 2. URL Format (Remote Servers)

```json
{
  "mcpServers": {
    "server-name": {
      "url": "https://example.com/mcp-endpoint"
    }
  }
}
```

## Configuration Examples

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "~/"],
      "env": {
        "NODE_ENV": "production"
      }
    },
    "DeepWiki": {
      "url": "https://mcp.deepwiki.com/sse"
    }
  }
}
```

## Popular MCP Servers

- **fetch**: Tool for retrieving web content
- **filesystem**: File system operation tools
- **DeepWiki**: Knowledge base search tool
- **git**: Git operation tools
- **postgres**: PostgreSQL database operation tools

## Configuration Steps

1. Open the agent edit modal
2. Select the "MCP Servers" tab
3. Click "Add New MCP Server" button
4. Enter configuration in the JSON format above
5. Test the connection with "Test Connection"
6. Save the configuration

## Troubleshooting

**If connection errors occur:**
- Verify the command path is correct
- Check that required dependencies are installed
- Confirm environment variables are properly set

**If configuration errors occur:**
- Verify the JSON format is correct
- Ensure the `mcpServers` object is included
- Check for duplicate server names