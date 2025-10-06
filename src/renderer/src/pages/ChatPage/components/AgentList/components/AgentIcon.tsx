import React from 'react'
import { CustomAgent } from '@/types/agent-chat'
import { TbRobot } from 'react-icons/tb'
import { AGENT_ICONS } from '@renderer/components/icons/AgentIcons'

interface AgentIconProps {
  agent: CustomAgent
  isCustomAgent: boolean
  isSelected: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
}

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
}

export const AgentIcon: React.FC<AgentIconProps> = ({
  agent,
  isCustomAgent,
  isSelected,
  size = 'md'
}) => {
  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center
        ${!isCustomAgent ? 'bg-gray-200 dark:bg-gray-700/80' : 'bg-blue-100 dark:bg-blue-800/80'}
        rounded-lg border border-transparent dark:border-gray-600 shadow-sm dark:shadow-inner`}
    >
      {agent.icon ? (
        React.cloneElement(
          (AGENT_ICONS.find((opt) => opt.value === agent.icon)?.icon as React.ReactElement) ??
            AGENT_ICONS[0].icon,
          {
            className: `${iconSizeClasses[size]} ${isSelected ? 'dark:text-blue-300' : 'dark:text-gray-100'}`,
            style: {
              color:
                agent.iconColor ||
                (isSelected ? 'var(--tw-text-blue-600)' : 'var(--tw-text-gray-700)'),
              filter: 'brightness(1.2) contrast(1.2)'
            }
          }
        )
      ) : (
        <TbRobot
          className={`${iconSizeClasses[size]} ${
            isSelected ? 'text-blue-700 dark:text-blue-200' : 'text-blue-600 dark:text-gray-100'
          } filter brightness-110 contrast-125`}
        />
      )}
    </div>
  )
}
