import React from 'react'
import { CustomAgent } from '@/types/agent-chat'
import { LoadingSkeleton } from './LoadingSkeleton'
import { EmptyState } from './EmptyState'
import { AgentCard } from './AgentCard'

interface AgentListProps {
  agents: CustomAgent[]
  onSelectAgent: (agent: CustomAgent) => void
  onTagClick?: (tag: string) => void
  isLoading?: boolean
}

export const AgentList: React.FC<AgentListProps> = ({
  agents,
  onSelectAgent,
  onTagClick,
  isLoading = false
}) => {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (agents.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} onSelect={onSelectAgent} onTagClick={onTagClick} />
      ))}
    </div>
  )
}
