import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import useSetting from '@renderer/hooks/useSetting'
import { useAgentChat } from '../../hooks/useAgentChat'
import { ToolState } from '@/types/agent-chat'
import { SOFTWARE_AGENT_SYSTEM_PROMPT } from '../../constants/DEFAULT_AGENTS'

export interface GeneratedScenario {
  title: string
  content: string
}

function isValidScenario(obj: unknown): obj is GeneratedScenario {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'title' in obj &&
    'content' in obj &&
    typeof (obj as GeneratedScenario).title === 'string' &&
    typeof (obj as GeneratedScenario).content === 'string'
  )
}

function extractCompleteObjects(text: string): GeneratedScenario[] {
  // 最初の '[' を見つける
  const startIndex = text.indexOf('[')
  if (startIndex === -1) return []

  const scenarios: GeneratedScenario[] = []
  let currentIndex = startIndex + 1
  let bracketCount = 0
  let currentObject = ''
  let inString = false
  let escapeNext = false

  while (currentIndex < text.length) {
    const char = text[currentIndex]

    // 文字列内のエスケープ文字の処理
    if (escapeNext) {
      currentObject += char
      escapeNext = false
      currentIndex++
      continue
    }

    // エスケープ文字の処理
    if (char === '\\' && inString) {
      currentObject += char
      escapeNext = true
      currentIndex++
      continue
    }

    // 文字列の開始/終了の処理
    if (char === '"') {
      inString = !inString
    }

    // 文字列内の場合は、そのまま追加
    if (inString) {
      currentObject += char
      currentIndex++
      continue
    }

    // オブジェクトの開始/終了の処理
    if (char === '{') {
      bracketCount++
    } else if (char === '}') {
      bracketCount--

      // オブジェクトが完了した場合
      if (bracketCount === 0) {
        currentObject += char
        try {
          const parsed = JSON.parse(currentObject)
          if (isValidScenario(parsed)) {
            scenarios.push(parsed)
          }
        } catch (e) {
          // パースに失敗した場合は無視
        }
        currentObject = ''
      }
    }

    // 現在のオブジェクトの構築中
    if (bracketCount > 0 || char === '{') {
      currentObject += char
    }

    currentIndex++
  }

  return scenarios
}

/**
 * システムプロンプト生成用のプロンプトテンプレート
 */
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

/**
 * シナリオ生成用のプロンプトテンプレート
 */
const getScenarioPromptTemplate =
  () => `You are an AI assistant that helps create scenarios for a custom AI agent.
Based on the following agent name, description, and system prompt, generate a set of example scenarios that would be useful for this agent.

Please generate:
5-8 example scenarios that cover different use cases for the agent. Each scenario should have a short title and a conversation starter message.

Rules:
<Rules>
- Each scenario should represent a different use case or capability of the agent
- The conversation starter should be a user message that would initiate that specific scenario
- The scenarios should be realistic and practical examples of how the agent would be used
- Each scenario should focus on a distinct capability of the agent
- Please output in JSON format with title and content properties
- Please output in the language entered for the Agent Name and Description.
</Rules>
`

/**
 * システムプロンプトとシナリオの生成機能を提供するカスタムフック
 */
export function usePromptGeneration(
  name: string,
  description: string,
  system: string,
  onSystemPromptGenerated: (prompt: string) => void,
  onScenariosGenerated: (scenarios: Array<{ title: string; content: string }>) => void
) {
  const { t } = useTranslation()
  const { currentLLM: llm, selectedAgentId, getAgentTools } = useSetting()
  const [isGeneratingSystem, setIsGeneratingSystem] = useState(false)
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(false)

  // システムプロンプト生成
  const agentTools = getAgentTools(selectedAgentId)
  const systemPromptTemplate = getPromptTemplate(agentTools)

  const {
    messages: systemMessages,
    loading: loadingSystem,
    handleSubmit: submitSystemPrompt
  } = useAgentChat(llm?.modelId || '', systemPromptTemplate, undefined, undefined, {
    enableHistory: false
  })

  // シナリオ生成
  const scenarioPromptTemplate = getScenarioPromptTemplate()

  const {
    messages: scenarioMessages,
    loading: loadingScenarios,
    handleSubmit: submitScenarioPrompt
  } = useAgentChat(llm?.modelId || '', scenarioPromptTemplate, undefined, undefined, {
    enableHistory: false
  })

  // システムプロンプト生成
  const generateSystemPrompt = useCallback(async () => {
    if (!name || !description) {
      toast.error(t('pleaseEnterNameAndDescription'))
      return
    }

    setIsGeneratingSystem(true)
    const input = `Agent Name: ${name}\nDescription: ${description}`
    await submitSystemPrompt(input)
    setIsGeneratingSystem(false)
  }, [name, description, submitSystemPrompt, t])

  // シナリオ生成
  const generateScenarios = useCallback(async () => {
    if (!name || !description || !system) {
      toast.error(t('inputAgentInfoError'))
      return
    }

    setIsGeneratingScenarios(true)
    const input = `Agent Name: ${name}\nDescription: ${description}\nSystem Prompt: ${system}`
    await submitScenarioPrompt(input)
    setIsGeneratingScenarios(false)
  }, [name, description, system, submitScenarioPrompt, t])

  // システムプロンプト生成結果の処理
  useEffect(() => {
    if (systemMessages.length > 1) {
      const lastMessage = systemMessages[systemMessages.length - 1]
      if (lastMessage.content) {
        // lastMessage.content の配列のなかから text フィールドを含む要素を取り出す
        const textContent = lastMessage.content.find((v) => v.text)
        if (textContent && textContent.text) {
          onSystemPromptGenerated(textContent.text)
        }
      }
    }
  }, [systemMessages, onSystemPromptGenerated])

  // シナリオ生成結果の処理
  useEffect(() => {
    if (scenarioMessages.length > 1) {
      const lastMessage = scenarioMessages[scenarioMessages.length - 1]
      if (lastMessage.content) {
        const textContent = lastMessage.content.find((v) => v.text)
        if (textContent && textContent.text) {
          try {
            // テキストをJSONとしてパースを試みる
            const scenarios = extractCompleteObjects(textContent.text)
            if (Array.isArray(scenarios)) {
              onScenariosGenerated(scenarios)
            }
          } catch (e) {
            console.error('Failed to parse scenarios:', e)
          }
        }
      }
    }
  }, [scenarioMessages, onScenariosGenerated])

  return {
    generateSystemPrompt,
    generateScenarios,
    isGeneratingSystem: isGeneratingSystem || loadingSystem,
    isGeneratingScenarios: isGeneratingScenarios || loadingScenarios
  }
}
