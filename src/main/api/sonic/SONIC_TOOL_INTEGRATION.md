# Sonic Tool Integration Documentation

## Overview

This document describes the integration of Bedrock Engineer's tool system with Nova Sonic's bidirectional streaming client, enabling AI agents to execute powerful tools during voice conversations.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Nova Sonic    │    │  SonicTool       │    │   Frontend      │
│   Client        │────│  Executor        │────│   (Renderer)    │
│   (Main)        │    │  (Socket.io)     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Tool Use       │    │  IPC Bridge      │    │  Preload Tools  │
│  Processing     │    │  via Socket.io   │    │  System         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components

### 1. SonicToolExecutor (`/src/main/api/sonic/tool-executor/`)

**Purpose**: Manages tool execution requests between main process and frontend via Socket.io

**Key Features**:

- Request/response mapping with timeout handling
- Socket connection management
- Error handling and logging
- Statistics tracking

**Methods**:

- `executeToolViaSocket()`: Execute a tool via Socket.io communication
- `registerSocketHandlers()`: Register event handlers for tool execution
- `getStatistics()`: Get execution statistics
- `dispose()`: Clean up resources

### 2. Enhanced Nova Sonic Client

**Purpose**: Modified to support both legacy hardcoded tools and new preload tool system

**Key Features**:

- Fallback mechanism (new tools → legacy tools)
- Tool name mapping from Nova Sonic format to preload format
- Special handling for different tool types
- Detailed logging for debugging

**Methods**:

- `setToolExecutor()`: Set the tool executor instance
- `convertToToolInput()`: Convert Nova Sonic tool format to preload format
- `processToolUse()`: Main tool processing with fallback
- `processLegacyToolUse()`: Legacy hardcoded tool implementation

### 3. Frontend Tool Handler

**Purpose**: Receives tool execution requests via Socket.io and executes them using preload APIs

**Key Features**:

- Automatic tool execution on request
- Error handling and response formatting
- Integration with existing Socket.io connection

## Tool Name Mapping

Nova Sonic tools are mapped to preload tools as follows:

| Nova Sonic Tool          | Preload Tool         | Description                        |
| ------------------------ | -------------------- | ---------------------------------- |
| `getdateandtimetool`     | `think`              | Date/time information via thinking |
| `getweathertool`         | `fetchWebsite`       | Weather data via API call          |
| `websearchtool`          | `tavilySearch`       | Web search functionality           |
| `createfoldertool`       | `createFolder`       | File system operations             |
| `readfilestool`          | `readFiles`          | File reading                       |
| `writetofiletool`        | `writeToFile`        | File writing                       |
| `listfilestool`          | `listFiles`          | Directory listing                  |
| `movefiletool`           | `moveFile`           | File moving                        |
| `copyfiletool`           | `copyFile`           | File copying                       |
| `applydiffedittool`      | `applyDiffEdit`      | Code editing                       |
| `generateimagetool`      | `generateImage`      | Image generation                   |
| `recognizeimagetool`     | `recognizeImage`     | Image recognition                  |
| `executecommandtool`     | `executeCommand`     | System commands                    |
| `retrievetool`           | `retrieve`           | Knowledge base queries             |
| `invokebedrockagenttool` | `invokeBedrockAgent` | AI agent invocation                |
| `invokeflowtool`         | `invokeFlow`         | Workflow execution                 |
| `codeinterpretertool`    | `codeInterpreter`    | Code execution                     |
| `thinktool`              | `think`              | AI reasoning                       |

## Usage Example

```typescript
// In Nova Sonic conversation, when AI decides to use a tool:
// 1. AI sends tool use request via streaming
// 2. processToolUse() is called with tool name and content
// 3. Tool is converted and sent via Socket.io to frontend
// 4. Frontend executes tool using preload API
// 5. Result is returned to Nova Sonic for continuation

// Example tool use content:
{
  "toolName": "getweathertool",
  "toolUseContent": {
    "content": "{\"latitude\": 37.7749, \"longitude\": -122.4194}"
  }
}

// Converted to preload format:
{
  "type": "fetchWebsite",
  "url": "https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194&current_weather=true",
  "options": {
    "method": "GET",
    "cleaning": false
  }
}
```

## Configuration

### Environment Variables

- `AWS_REGION`: AWS region for Bedrock services
- `AWS_PROFILE`: AWS profile for credentials

### Socket.io Events

- `tool:executeRequest`: Request tool execution (server → client)
- `tool:executeResponse`: Tool execution response (client → server)

## Error Handling

1. **Tool Conversion Errors**: Fallback to legacy implementation
2. **Socket Connection Errors**: Tool execution fails with clear error
3. **Timeout Errors**: 30-second timeout with cleanup
4. **Tool Execution Errors**: Proper error propagation

## Logging

All components use structured logging with categories:

- `sonic:tool-executor`: Tool executor operations
- `sonic:client`: Nova Sonic client operations
- `renderer:socket`: Frontend Socket.io operations

## Testing

### Manual Testing

1. Start the application
2. Open Speak Page
3. Connect to voice conversation
4. Ask AI to perform tasks that require tools
5. Monitor console logs for tool execution flow

### Debug Information

Enable debug logging by setting appropriate log levels in the logger configuration.

Key log messages to watch:

- "Executing tool via socket"
- "Tool executed successfully via Socket.io"
- "Falling back to legacy tool implementation"
- "Received tool execution request"
- "Tool execution completed"

## Performance Considerations

- **Timeout**: 30-second timeout for tool execution
- **Memory**: Pending requests are cleaned up automatically
- **Network**: Socket.io communication adds minimal latency
- **Fallback**: Legacy tools ensure functionality even if Socket.io fails

## Future Enhancements

1. **Tool Caching**: Cache frequently used tool results
2. **Batch Execution**: Execute multiple tools in parallel
3. **Advanced Mapping**: More sophisticated tool parameter conversion
4. **Monitoring**: Real-time tool execution monitoring dashboard
5. **Tool Discovery**: Dynamic tool discovery and registration

## Troubleshooting

### Common Issues

1. **"No active socket connection"**: Ensure Speak Page is connected
2. **"Tool execution timeout"**: Check tool complexity and network
3. **"Tool not supported"**: Verify tool name mapping
4. **"Socket connection lost"**: Restart application and reconnect

### Debug Steps

1. Check console logs for error messages
2. Verify Socket.io connection status
3. Test with simpler tools first
4. Check AWS credentials and permissions
5. Verify preload tool system is working independently

## Security Considerations

- Tool execution requires active Socket.io connection
- All tool parameters are validated before execution
- Error messages are sanitized before transmission
- Timeout prevents resource exhaustion
- Tool access is limited to preload-defined tools only
