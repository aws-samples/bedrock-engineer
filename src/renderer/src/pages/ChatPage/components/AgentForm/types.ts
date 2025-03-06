import { CustomAgent, KnowledgeBase } from '@/types/agent-chat'
import { CommandConfig } from '../../modals/useToolSettingModal'
import { BedrockAgent } from '../../modals/useToolSettingModal/BedrockAgentSettingForm'

export interface AgentFormProps {
  agent: CustomAgent
  onSave: (agent: CustomAgent) => void
  onCancel: () => void
}

export interface BasicSectionProps {
  name: string
  description: string
  icon?: string
  iconColor?: string
  onChange: (
    field: 'name' | 'description' | 'icon' | 'iconColor',
    value: string | undefined
  ) => void
}

export interface SystemPromptSectionProps {
  system: string
  name: string
  description: string
  onChange: (value: string) => void
  onAutoGenerate: () => void
  isGenerating: boolean
  projectPath: string
  allowedCommands: CommandConfig[]
  knowledgeBases: KnowledgeBase[]
  bedrockAgents: BedrockAgent[]
}

export interface ScenariosSectionProps {
  scenarios: Array<{ title: string; content: string }>
  name: string
  description: string
  system: string
  onChange: (scenarios: Array<{ title: string; content: string }>) => void
  isGenerating: boolean
  onAutoGenerate: () => void
}
