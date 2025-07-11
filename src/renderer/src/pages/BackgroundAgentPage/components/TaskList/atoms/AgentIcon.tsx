import React from 'react'
import { CogIcon } from '@heroicons/react/24/outline'
import { getIconByValue } from '@renderer/components/icons/AgentIcons'
import { AgentIcon as AgentIconType } from '@/types/agent-chat'

interface AgentIconProps {
  agent: { icon?: string; iconColor?: string; name: string } | null
  size?: 'sm' | 'md'
}

export const AgentIcon: React.FC<AgentIconProps> = ({ agent, size = 'sm' }) => {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  if (!agent?.icon) {
    return <CogIcon className={`${iconSize} flex-shrink-0`} />
  }

  // 既存のAgentIconsコンポーネントを使用
  const iconElement = getIconByValue(agent.icon as AgentIconType, agent.iconColor)

  return (
    <div className={`${iconSize} flex items-center justify-center flex-shrink-0`}>
      {iconElement}
    </div>
  )
}
