import { useEffect, useState } from 'react'
import useSetting from '@renderer/hooks/useSetting'
import { useAgentChat } from './useAgentChat'
import { ToolState } from '@/types/agent-chat'
import { SOFTWARE_AGENT_SYSTEM_PROMPT } from '../constants/DEFAULT_AGENTS'

const getPromptTemplate = (
  tools: ToolState[]
) => `You are an AI assistant that helps create a custom AI agent configuration.
Based on the following agent name and description, generate a system prompt that would be appropriate for this agent.

Please generate:
A detailed system prompt that defines the agent's capabilities, personality, and behavior

Rules:
<Rules>
- The system prompt should be comprehensive but focused on the agent's specific domain
- The system prompt must always include the project path placeholder: {{projectPath}}
- You can also use the placeholders
  - {{date}} to represent the current date and time
  - {{allowedCommands}} to represent a list of available tools.
  - {{knowledgeBases}} to represent a list of knowledge bases.
  - {{bedrockAgents}} to represent a list of bedrock agents.
- Available tools are ${JSON.stringify(tools)}. Please specify how these tools should be used.
- No explanation or \`\`\` needed, just print the system prompt.
- Please output in the language entered for the Agent Name and Description.
</Rules>

Here is the system prompt example for a software agent:
<Examples>
${SOFTWARE_AGENT_SYSTEM_PROMPT}
</Examples>
`

export const useAgentGenerator = () => {
  const [result, setResult] = useState<string>()
  const { currentLLM: llm, tools } = useSetting()

  const promptTemplate = getPromptTemplate(tools)

  const { messages, loading, handleSubmit } = useAgentChat(
    llm?.modelId,
    promptTemplate,
    [],
    undefined,
    { enableHistory: false }
  )

  const generateAgentSystemPrompt = async (name: string, description: string) => {
    const input = `Agent Name: ${name}
Description: ${description}
`
    await handleSubmit(input)
  }

  useEffect(() => {
    if (messages.length > 1) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.content) {
        setResult(lastMessage.content[0].text)
      }
    }
  }, [messages])

  return {
    generateAgentSystemPrompt,
    generatedAgentSystemPrompt: result,
    isGenerating: loading
  }
}
