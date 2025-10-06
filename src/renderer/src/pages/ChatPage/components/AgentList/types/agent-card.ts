import { CustomAgent } from '@/types/agent-chat'

export interface AgentCardActions {
  onEdit?: (agent: CustomAgent) => void
  onDuplicate?: (agent: CustomAgent) => void
  onDelete?: (agentId: string) => void
  onSaveAsShared?: (agent: CustomAgent) => void
  onShareToOrganization?: (agent: CustomAgent) => void
  onConvertToStrands?: (agentId: string) => void
}

export interface AgentCardBaseProps {
  agent: CustomAgent
  isCustomAgent: boolean
  isSelected: boolean
  onSelect: (agentId: string) => void
  actions: AgentCardActions
}
