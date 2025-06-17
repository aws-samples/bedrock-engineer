# MCP Tool Naming Convention Guide

## Overview

This document describes the naming conventions and handling for MCP (Model Context Protocol) tools in the Bedrock Engineer application.

## Problem Statement

Previously, there was inconsistency between tool names used in:
- **Tool Specifications (toolSpec)**: Used `mcp_` prefixed names (e.g., `mcp_search_files`)
- **System Prompt Descriptions**: Used original names without prefix (e.g., `search_files`)

This caused confusion for AI agents about which tool name to trust and use.

## Solution

### 1. Unified Naming Convention

**All MCP tools are consistently referenced with the `mcp_` prefix throughout the system:**

- Tool specifications: `mcp_search_files`
- System prompt descriptions: `mcp_search_files`
- Tool execution: `mcp_search_files`
- API references: `mcp_search_files`

### 2. Implementation Details

#### Tool Name Processing Flow

```
Original MCP Tool: "search_files"
    ↓
Add prefix in getMcpToolSpecs(): "mcp_search_files"
    ↓
Use in toolSpec: "mcp_search_files"
    ↓
Use in systemPromptDescription: "mcp_search_files"
    ↓
AI Agent calls: "mcp_search_files"
    ↓
Execute via McpToolAdapter with name resolution
```

#### Code Changes

1. **ToolMetadataCollector Enhancement**
   ```typescript
   // Added MCP-specific methods
   static getMcpSystemPromptDescriptions(mcpServers?: any[]): Record<string, string>
   static getAllToolMetadataWithMcp(mcpServers?: any[]): { toolSpecs: Tool[], systemPromptDescriptions: Record<string, string> }
   ```

2. **ToolMetadataHelper Enhancement**
   ```typescript
   // Added MCP-aware functions
   export async function getMcpSystemPromptDescriptions(mcpServers: McpServerConfig[]): Promise<Record<string, string>>
   export async function getAllSystemPromptDescriptions(mcpServers: McpServerConfig[]): Promise<Record<string, string>>
   export async function getToolUsageDescriptionWithMcp(toolName: string, mcpServers: McpServerConfig[]): Promise<string>
   ```

3. **API Extension**
   ```typescript
   // Added MCP-aware API methods
   tools: {
     getAllToolMetadataWithMcp: (mcpServers?: any[]) => ToolMetadataCollector.getAllToolMetadataWithMcp(mcpServers),
     getAllSystemPromptDescriptions: async (mcpServers?: any[]) => getAllSystemPromptDescriptions(mcpServers),
     getToolUsageDescriptionWithMcp: async (toolName: string, mcpServers?: any[]) => getToolUsageDescriptionWithMcp(toolName, mcpServers)
   }
   ```

### 3. Usage Guidelines

#### For Developers

1. **When adding MCP server integration:**
   ```typescript
   // Use the enhanced metadata functions
   const allDescriptions = await getAllSystemPromptDescriptions(mcpServers)
   ```

2. **When generating system prompts:**
   ```typescript
   // Include MCP servers in metadata collection
   const metadata = ToolMetadataCollector.getAllToolMetadataWithMcp(mcpServers)
   ```

3. **When implementing tool handlers:**
   ```typescript
   // Always expect mcp_ prefixed names
   if (isMcpTool(input.type)) {
     // Handle with McpToolAdapter
   }
   ```

#### For AI Agents

- **Always use `mcp_` prefixed tool names** when calling MCP tools
- **Refer to system prompt descriptions** for usage guidance
- **Trust the toolSpec names** as the authoritative source

### 4. Benefits

1. **Consistency**: No ambiguity about which tool name to use
2. **Clarity**: Clear distinction between built-in and MCP tools
3. **Maintainability**: Centralized naming logic
4. **Extensibility**: Easy to add new MCP servers without naming conflicts

### 5. Migration Notes

- **Backward Compatibility**: Existing MCP tool calls continue to work
- **No Breaking Changes**: Internal name resolution handles both formats
- **Gradual Adoption**: System prompts will gradually reflect the new naming

## Testing

The implementation includes test cases to verify:
- MCP tool specifications have correct `mcp_` prefixes
- System prompt descriptions include MCP tools with prefixes
- Tool name resolution works correctly in both directions
- API methods return consistent results

## Future Enhancements

1. **Dynamic Tool Discovery**: Enhance MCP tool description generation based on actual tool schemas
2. **Tool Documentation**: Auto-generate detailed documentation from MCP server capabilities
3. **Naming Validation**: Add validation to ensure consistent naming across the system