import React from 'react'
import { CustomAgent } from '@/types/agent-chat'
import { AgentCardActions } from '../types/agent-card'
import { AgentCardGrid } from './AgentCardGrid'
import { AgentCardCompact } from './AgentCardCompact'
import { useAgentPermissions } from '../hooks/useAgentPermissions'

interface AgentCardProps {
  agent: CustomAgent
  isSelected: boolean
  isCompact?: boolean
  onSelect: (agentId: string) => void
  actions: AgentCardActions
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected,
  isCompact = false,
  onSelect,
  actions
}) => {
  const { isCustomAgent } = useAgentPermissions(agent)

  const baseProps = {
    agent,
    isCustomAgent,
    isSelected,
    onSelect,
    actions
  }

  if (isCompact) {
    return <AgentCardCompact {...baseProps} />
  }

  return <AgentCardGrid {...baseProps} />
}
