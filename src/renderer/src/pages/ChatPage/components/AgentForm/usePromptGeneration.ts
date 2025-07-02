import { useState, useCallback, useEffect, useRef } from 'react'
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
  tools: ToolState[],
  additionalInstruction?: string
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
- Please specify how these tools should be used.
- No explanation or \`\`\` needed, just print the system prompt.
- Please output in the language entered for the Agent Name and Description.
- Be sure to include the following instructions:
  - Visual explanation: Mermaid.js format, Markdown format for Image, Katex for Math
</Rules>

Available Tools:
<Tools>
${JSON.stringify(tools)}
</Tools>

${
  additionalInstruction
    ? `
Additional Instruction:
${additionalInstruction}`
    : ''
}

Here is the system prompt example for a software agent:
<Examples>
${SOFTWARE_AGENT_SYSTEM_PROMPT}
</Examples>
`

/**
 * 音声チャット用システムプロンプト生成用のプロンプトテンプレート
 */
const getVoiceChatPromptTemplate = (
  tools: ToolState[],
  additionalInstruction?: string
) => `You are an AI assistant that helps create a custom AI agent configuration optimized for voice-based conversations.
Based on the following agent name and description, generate a system prompt that would be appropriate for this agent in speech-to-speech interactions.

Please generate:
A detailed system prompt that defines the agent's capabilities, personality, and behavior specifically optimized for spoken conversations

Rules:
<Rules>
- The system prompt should be optimized for voice-based interactions (Nova Sonic)
- Start with the baseline: "You are a friend. You and the user will engage in a spoken dialog exchanging the transcripts of a natural real-time conversation."
- Include natural speech elements like "Well," "You know," "Actually," "I mean," or "By the way" at appropriate moments
- Express emotions verbally through phrases like "Haha," "Wow," "Hmm," "Oh!" or "That's amazing!" when appropriate
- Incorporate natural speech pauses using ellipses (...) when thinking or transitioning between topics
- Use phrases like "The key thing to remember is," "What's really important here is" for emphasis instead of bold/italics
- When sharing multiple points, use "first," "second," and "finally" to help the listener track information
- End complex explanations with "So in summary..." to reinforce key takeaways
- Before sharing multiple ideas, give previews like "I'm thinking of three reasons why..."
- After completing topics, use phrases like "That covers what I wanted to share about..." to signal transitions
- Keep responses conversational and natural for spoken delivery
- Please specify how these tools should be used in a conversational manner
- Please output in the language entered for the Agent Name and Description.
</Rules>

Available Tools:
<Tools>
${JSON.stringify(tools)}
</Tools>

${
  additionalInstruction
    ? `
Additional Instruction:
${additionalInstruction}`
    : ''
}
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
  onScenariosGenerated: (scenarios: Array<{ title: string; content: string }>) => void,
  additionalInstruction?: string,
  customTools?: ToolState[] // Additional: Receive custom tool information
) {
  const { t } = useTranslation()
  const { currentLLM: llm, selectedAgentId, getAgentTools } = useSetting()
  const [isGeneratingSystem, setIsGeneratingSystem] = useState(false)
  const [isGeneratingVoiceChat, setIsGeneratingVoiceChat] = useState(false)
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(false)

  // Hold the latest references of callback functions to avoid unnecessary re-renders
  const onSystemPromptGeneratedRef = useRef(onSystemPromptGenerated)
  const onScenariosGeneratedRef = useRef(onScenariosGenerated)

  // Update callback function references
  useEffect(() => {
    onSystemPromptGeneratedRef.current = onSystemPromptGenerated
  }, [onSystemPromptGenerated])

  useEffect(() => {
    onScenariosGeneratedRef.current = onScenariosGenerated
  }, [onScenariosGenerated])

  // システムプロンプト生成
  // カスタムツールが提供されていればそれを使用、なければ既存のエージェントツールを使用
  const agentTools = customTools || getAgentTools(selectedAgentId)
  const systemPromptTemplate = getPromptTemplate(agentTools, additionalInstruction)
  const voiceChatPromptTemplate = getVoiceChatPromptTemplate(agentTools, additionalInstruction)

  const {
    messages: systemMessages,
    loading: loadingSystem,
    handleSubmit: submitSystemPrompt
  } = useAgentChat(llm?.modelId || '', systemPromptTemplate, undefined, undefined, {
    enableHistory: false
  })

  // 音声チャット用システムプロンプト生成
  const {
    messages: voiceChatMessages,
    loading: loadingVoiceChat,
    handleSubmit: submitVoiceChatPrompt
  } = useAgentChat(llm?.modelId || '', voiceChatPromptTemplate, undefined, undefined, {
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

  // 音声チャット用システムプロンプト生成
  const generateVoiceChatPrompt = useCallback(async () => {
    if (!name || !description) {
      toast.error(t('pleaseEnterNameAndDescription'))
      return
    }

    setIsGeneratingVoiceChat(true)
    const input = `Agent Name: ${name}\nDescription: ${description}`
    await submitVoiceChatPrompt(input)
    setIsGeneratingVoiceChat(false)
  }, [name, description, submitVoiceChatPrompt, t])

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

  // Process system prompt generation results
  useEffect(() => {
    if (systemMessages.length > 1) {
      const lastMessage = systemMessages[systemMessages.length - 1]
      if (lastMessage.content) {
        // Extract text field from lastMessage.content array
        const textContent = lastMessage.content.find((v) => v.text)
        if (textContent && textContent.text) {
          onSystemPromptGeneratedRef.current(textContent.text)
        }
      }
    }
  }, [systemMessages])

  // Process voice chat system prompt generation results
  useEffect(() => {
    if (voiceChatMessages.length > 1) {
      const lastMessage = voiceChatMessages[voiceChatMessages.length - 1]
      if (lastMessage.content) {
        const textContent = lastMessage.content.find((v) => v.text)
        if (textContent && textContent.text) {
          onSystemPromptGeneratedRef.current(textContent.text)
        }
      }
    }
  }, [voiceChatMessages])

  // Process scenario generation results
  useEffect(() => {
    if (scenarioMessages.length > 1) {
      const lastMessage = scenarioMessages[scenarioMessages.length - 1]
      if (lastMessage.content) {
        const textContent = lastMessage.content.find((v) => v.text)
        if (textContent && textContent.text) {
          try {
            // Attempt to parse text as JSON
            const scenarios = extractCompleteObjects(textContent.text)
            if (Array.isArray(scenarios)) {
              onScenariosGeneratedRef.current(scenarios)
            }
          } catch (e) {
            console.error('Failed to parse scenarios:', e)
          }
        }
      }
    }
  }, [scenarioMessages])

  return {
    generateSystemPrompt,
    generateVoiceChatPrompt,
    generateScenarios,
    isGeneratingSystem: isGeneratingSystem || loadingSystem,
    isGeneratingVoiceChat: isGeneratingVoiceChat || loadingVoiceChat,
    isGeneratingScenarios: isGeneratingScenarios || loadingScenarios
  }
}
