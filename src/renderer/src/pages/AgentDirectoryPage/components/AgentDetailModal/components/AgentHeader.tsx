import React from 'react'
import { TbRobot } from 'react-icons/tb'
import { AgentIcon } from '@/types/agent-chat'
import { getIconByValue } from '@renderer/components/icons/AgentIcons'

interface AgentHeaderProps {
  name: string
  description?: string
  icon?: AgentIcon
  iconColor?: string
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ name, description, icon, iconColor }) => {
  const defaultColor = '#3B82F6'

  return (
    <div className="flex items-start">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-blue-100 dark:bg-blue-900/40 flex-shrink-0">
        {icon ? (
          getIconByValue(icon, iconColor || defaultColor) || (
            <TbRobot className="w-6 h-6" style={{ color: iconColor || defaultColor }} />
          )
        ) : (
          <span className="text-2xl" style={{ color: iconColor || defaultColor }}>
            👤
          </span>
        )}
      </div>
      <div>
        <h2 className="text-2xl font-bold dark:text-white">{name}</h2>
        {description && <p className="text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
    </div>
  )
}
