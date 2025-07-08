import React from 'react'
import { Agent } from '@/types/agent-chat'
import { TbRobot } from 'react-icons/tb'
import { AGENT_ICONS } from '@renderer/components/icons/AgentIcons'

type AgentSelectorProps = {
  agents: readonly Agent[]
  selectedAgent: string
  onOpenSettings: () => void
  alignment?: 'left' | 'center'
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  selectedAgent,
  onOpenSettings,
  alignment = 'center'
}) => {
  const selectedAgentData = agents.find((agent) => agent.id === selectedAgent)

  const containerClass = alignment === 'left' ? 'justify-start' : 'justify-center'

  return (
    <div className={`${containerClass} flex items-center gap-2`}>
      <div className="relative w-[30vw]">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm
            text-gray-600 dark:text-gray-300 rounded-md hover:text-gray-800 dark:hover:text-gray-500
            transition-colors"
        >
          <span className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">
              {selectedAgentData?.icon ? (
                React.cloneElement(
                  (AGENT_ICONS.find((opt) => opt.value === selectedAgentData.icon)
                    ?.icon as React.ReactElement) ?? AGENT_ICONS[0].icon,
                  {
                    className: 'w-5 h-5',
                    style: selectedAgentData.iconColor
                      ? { color: selectedAgentData.iconColor }
                      : undefined
                  }
                )
              ) : (
                <TbRobot className="w-5 h-5" />
              )}
            </span>
            <span className="flex-1 text-left">{selectedAgentData?.name}</span>
          </span>
        </button>
      </div>
    </div>
  )
}
