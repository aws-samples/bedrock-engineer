import { useEffect, useState } from 'react'
import useSetting from '@renderer/hooks/useSetting'
import { useAgentChat } from './useAgentChat'

const getScenarioPromptTemplate =
  () => `You are an AI assistant that helps create scenarios for AI agents.
Based on the following agent name, description, and system prompt, generate a list of useful scenarios that would demonstrate the agent's capabilities.

Please generate scenarios in the following format:
[
  {
    "title": "Brief title describing the scenario",
    "content": "The actual instruction or prompt for the agent"
  }
]

Rules:
<Rules>
- Generate 3-5 practical scenarios that showcase the agent's key functionalities
- Each scenario should be focused and demonstrate a specific use case
- Scenarios should be realistic and commonly encountered situations
- The content should be clear and actionable
- The title should be concise but descriptive
- Output should be in valid JSON format
- Please output in the language entered for the Agent information
</Rules>

Example for a software development agent:
[
  {
    "title": "Create a new React component",
    "content": "Create a new React component called UserProfile that displays user information including name, email, and avatar"
  },
  {
    "title": "Debug API integration",
    "content": "Help me debug an issue with my API integration. The fetch request is failing with a CORS error"
  }
]
`

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

export const useScenarioGenerator = () => {
  const [result, setResult] = useState<GeneratedScenario[]>([])
  const { currentLLM: llm } = useSetting()

  const promptTemplate = getScenarioPromptTemplate()

  const { messages, loading, handleSubmit } = useAgentChat(
    llm?.modelId,
    promptTemplate,
    [],
    undefined,
    { enableHistory: false }
  )

  const generateScenarios = async (name: string, description: string, systemPrompt: string) => {
    const input = `Agent Name: ${name}
Description: ${description}
System Prompt: ${systemPrompt}
`
    await handleSubmit(input)
  }

  useEffect(() => {
    if (messages.length > 1) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.content && lastMessage.content[0].text) {
        const parsedScenarios = extractCompleteObjects(lastMessage.content[0].text)
        console.log(parsedScenarios)
        if (parsedScenarios.length > 0) {
          setResult(parsedScenarios)
        }
      }
    }
  }, [messages, loading])

  return {
    generateScenarios,
    generatedScenarios: result,
    isGenerating: loading
  }
}
