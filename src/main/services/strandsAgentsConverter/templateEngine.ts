// MCP integrated Python agent template
export const MCP_INTEGRATED_TEMPLATE = `#!/usr/bin/env python3
"""
Generated Strands Agent with MCP Server Integration
Agent: {{agentName}}
Description: {{agentDescription}}
Generated on: {{generationDate}}
"""

{{imports}}

# System prompt
SYSTEM_PROMPT = """{{systemPrompt}}"""

# AWS configuration
session = boto3.Session(
    region_name="{{awsRegion}}",
)

{{mcpClientSetup}}

def setup_basic_tools():
    """Configure basic tools used by the agent"""
    tools = []
    {{basicToolsSetup}}
    {{specialSetupCode}}
    return tools

def create_model():
    """Create Bedrock model"""
    bedrock_model = BedrockModel(
        model_id="{{modelConfig}}",
        temperature=0.3,
        top_p=0.8,
        boto_session=session
    )
    return bedrock_model

def main():
    """Main agent execution function"""
    try:
        # Setup basic tools
        basic_tools = setup_basic_tools()

        # Connect to MCP servers and collect tools
        all_tools = basic_tools.copy()

        {{mcpContextManager}}:
{{mcpToolsCollection}}

            # Create and configure agent
            agent = Agent(
                system_prompt=SYSTEM_PROMPT,
                tools=all_tools,
                model=create_model()
            )

            # Interactive chat loop
            print(f"🤖 {{agentName}} agent is ready!")
            print("Type 'quit' or 'exit' to terminate the session")

            while True:
                try:
                    user_input = input("\\n👤 You: ")
                    if user_input.lower().strip() in ['quit', 'exit']:
                        break

                    if not user_input.strip():
                        continue

                    response = agent(user_input)
                    print(f"🤖 Agent: {response}")

                except KeyboardInterrupt:
                    print("\\n👋 Goodbye!")
                    break
                except Exception as e:
                    print(f"❌ Error occurred: {e}")

    except Exception as e:
        print(f"❌ Agent initialization error: {e}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
`

// Python code generation template
export const PYTHON_AGENT_TEMPLATE = `#!/usr/bin/env python3
"""
Generated Strands Agent from Bedrock Engineer
Agent: {{agentName}}
Description: {{agentDescription}}
"""

import boto3
from strands import Agent
{{imports}}
from strands.models import BedrockModel

# System prompt
SYSTEM_PROMPT = """{{systemPrompt}}"""

# AWS configuration
session = boto3.Session(
    region_name="{{awsRegion}}",
)

def setup_tools():
    """Configure tools used by the agent"""
    tools = []

    # Basic tools
    {{toolsSetup}}

    {{specialSetupCode}}

    return tools

def create_model():
    """Create Bedrock model"""
    bedrock_model = BedrockModel(
        model_id="us.anthropic.claude-sonnet-4-20250514-v1:0",
        temperature=0.3,
        top_p=0.8,
        boto_session=session
    )
    return bedrock_model

def create_agent():
    """Create agent instance"""
    return Agent(
        system_prompt=SYSTEM_PROMPT,
        tools=setup_tools(),
        model=create_model()
    )

def main():
    """Main execution function"""
    agent = create_agent()

    print("🤖 Agent is ready!")
    print(f"Agent name: {{agentName}}")
    print(f"Description: {{agentDescription}}")
    print("\\nUsage:")
    print("response = agent('Enter your question or task here')")
    print("print(response)")

    # Interactive mode
    while True:
        try:
            user_input = input("\\n💬 Enter your message (type 'quit' to exit): ")
            if user_input.lower() in ['quit', 'exit', 'q']:
                break

            print("\\n🤔 Processing...")
            response = agent(user_input)
            print(f"\\n🤖 Agent: {response}")

        except KeyboardInterrupt:
            print("\\n\\n👋 Exiting.")
            break
        except Exception as e:
            print(f"\\n❌ An error occurred: {e}")

if __name__ == "__main__":
    main()
`

// requirements.txt template
export const REQUIREMENTS_TEMPLATE = `# Strands Agents dependencies
strands-agents>=1.0.0
strands-agents-tools>=0.2.0

# MCP dependencies (if MCP servers are used)
{{mcpDependencies}}

# AWS dependencies (if needed)
boto3>=1.26.0
botocore>=1.29.0

# Additional dependencies based on tools used
{{additionalDependencies}}
`

// Configuration file (YAML) template
export const CONFIG_TEMPLATE = `# Strands Agent Configuration
agent:
  name: "{{agentName}}"
  description: "{{agentDescription}}"
  model_provider: "{{modelProvider}}"

tools:
  supported:
{{supportedTools}}

  unsupported:
{{unsupportedTools}}

environment:
{{environmentVars}}

notes: |
  This agent was automatically converted from a Bedrock Engineer CustomAgent.
  If detailed configuration or adjustments are needed, please edit the generated Python code directly.
`

// README template
export const README_TEMPLATE = `# {{agentName}}

{{agentDescription}}

## Overview

This agent was automatically converted from a Bedrock Engineer CustomAgent.

## Usage

### 1. Create Virtual Environment

Create and activate a Python virtual environment:

\`\`\`bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\\Scripts\\activate
# On macOS/Linux:
source .venv/bin/activate
\`\`\`

### 2. Install Dependencies

\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 3. Set Environment Variables

Set the required environment variables:

\`\`\`bash
{{environmentSetup}}
\`\`\`

### 4. Run the Agent

\`\`\`bash
python agent.py
\`\`\`

### 5. Programmatic Usage

\`\`\`python
from agent import create_agent

agent = create_agent()
response = agent("Enter your question or task here")
print(response)
\`\`\`

## Available Tools

{{toolsList}}

## Unsupported Tools

The following tools are not supported in automatic conversion:

{{unsupportedToolsList}}

## Notes

- When using AWS-related tools, appropriate AWS credentials must be configured
- Some tools may require environment-specific configuration
- Customize the generated code as needed

## Conversion Information

- Source: Bedrock Engineer CustomAgent
- Conversion Date: {{conversionDate}}
- Supported Tools: {{supportedToolsCount}}/{{totalToolsCount}}
`

// Function to replace template variables
export function renderTemplate(template: string, variables: Record<string, string>): string {
  let result = template

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value)
  }

  return result
}

// Generate tool setup section for Python code
export function generateToolsSetupCode(supportedTools: string[]): string {
  if (supportedTools.length === 0) {
    return '# No basic tools'
  }

  const toolsArray = supportedTools.map((tool) => tool).join(', ')
  return `tools.extend([${toolsArray}])`
}

// Combine special setup code
export function combineSpecialSetupCode(specialSetupCodes: string[]): string {
  return specialSetupCodes.filter((code) => code.trim()).join('\n\n')
}

// Generate YAML format list
export function generateYamlList(items: string[]): string {
  if (items.length === 0) {
    return '    []'
  }

  return items.map((item) => `    - "${item}"`).join('\n')
}

// Generate environment variable setup examples
export function generateEnvironmentSetup(envVars: Record<string, string>): string {
  const entries = Object.entries(envVars)

  if (entries.length === 0) {
    return '# No environment variables required'
  }

  return entries.map(([key, value]) => `export ${key}="${value}"`).join('\n')
}

// Generate MCP client setup code
export function generateMcpClientSetup(servers: Array<{ strandsCode: string }>): string {
  if (servers.length === 0) {
    return '# No MCP server configuration'
  }

  return servers.map((server) => server.strandsCode).join('\n\n')
}

// Generate MCP context manager code
export function generateMcpContextManager(clientNames: string[]): string {
  if (clientNames.length === 0) {
    return '# No MCP servers'
  }

  return `with ${clientNames.join(', ')}`
}

// Generate MCP tools collection code
export function generateMcpToolsCollection(
  servers: Array<{ original: { name: string }; clientVarName: string }>
): string {
  if (servers.length === 0) {
    return '            # No MCP tools'
  }

  return servers
    .map(
      (server) =>
        `            # Get tools from ${server.original.name}
            ${server.clientVarName}_tools = ${server.clientVarName}_client.list_tools_sync()
            all_tools.extend(${server.clientVarName}_tools)`
    )
    .join('\n')
}

// Generate MCP dependencies for requirements.txt
export function generateMcpDependencies(hasMcpServers: boolean): string {
  if (!hasMcpServers) {
    return ''
  }

  return `mcp>=1.12.1`
}
