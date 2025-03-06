import React from 'react'
import { AgentIcon } from '@/types/agent-chat'
import {
  TbRobot,
  TbBrain,
  TbDatabase,
  TbSearch,
  TbTerminal2,
  TbBrandAws,
  TbCloud,
  TbServer,
  TbNetwork,
  TbBuildingBank,
  TbBooks,
  TbPencil,
  TbMessages,
  TbBulb,
  TbPuzzle,
  TbSettings,
  TbTool,
  TbTestPipe,
  TbBug,
  TbChartBar,
  TbLock,
  TbShield,
  TbWorld
} from 'react-icons/tb'
import { FaCode, FaDocker, FaGithub, FaKeyboard, FaMicrochip, FaTerminal } from 'react-icons/fa'
import { MdDesignServices, MdArchitecture, MdSecurity, MdApi } from 'react-icons/md'
import { BsLaptopFill, BsChatDots, BsKanban, BsGit, BsDiagram3 } from 'react-icons/bs'
import { SiKubernetes, SiTerraform, SiGrafana, SiPrometheus } from 'react-icons/si'

export type AgentIconOption = {
  value: AgentIcon
  icon: React.ReactNode
  label: string
  category: 'general' | 'development' | 'cloud' | 'devops' | 'security' | 'monitoring'
  color?: string
}

export const AGENT_ICONS: AgentIconOption[] = [
  // General Purpose
  { value: 'robot', icon: <TbRobot />, label: 'Robot', category: 'general' },
  { value: 'brain', icon: <TbBrain />, label: 'Brain', category: 'general' },
  { value: 'chat', icon: <BsChatDots />, label: 'Chat', category: 'general' },
  { value: 'bulb', icon: <TbBulb />, label: 'Idea', category: 'general' },
  { value: 'books', icon: <TbBooks />, label: 'Documentation', category: 'general' },
  { value: 'pencil', icon: <TbPencil />, label: 'Editor', category: 'general' },
  { value: 'messages', icon: <TbMessages />, label: 'Communication', category: 'general' },
  { value: 'puzzle', icon: <TbPuzzle />, label: 'Problem Solving', category: 'general' },
  { value: 'world', icon: <TbWorld />, label: 'Global', category: 'general' },

  // Development
  { value: 'code', icon: <FaCode />, label: 'Code', category: 'development' },
  { value: 'terminal', icon: <FaTerminal />, label: 'Terminal', category: 'development' },
  { value: 'terminal2', icon: <TbTerminal2 />, label: 'Command Line', category: 'development' },
  { value: 'keyboard', icon: <FaKeyboard />, label: 'Programming', category: 'development' },
  { value: 'bug', icon: <TbBug />, label: 'Debug', category: 'development' },
  { value: 'test', icon: <TbTestPipe />, label: 'Testing', category: 'development' },
  { value: 'api', icon: <MdApi />, label: 'API', category: 'development' },
  { value: 'database', icon: <TbDatabase />, label: 'Database', category: 'development' },
  {
    value: 'architecture',
    icon: <MdArchitecture />,
    label: 'Architecture',
    category: 'development'
  },
  { value: 'design', icon: <MdDesignServices />, label: 'Design', category: 'development' },
  { value: 'diagram', icon: <BsDiagram3 />, label: 'Diagram', category: 'development' },
  { value: 'settings', icon: <TbSettings />, label: 'Configuration', category: 'development' },
  { value: 'tool', icon: <TbTool />, label: 'Tools', category: 'development' },

  // Cloud & Infrastructure
  { value: 'aws', icon: <TbBrandAws />, label: 'AWS', category: 'cloud' },
  { value: 'cloud', icon: <TbCloud />, label: 'Cloud', category: 'cloud' },
  { value: 'server', icon: <TbServer />, label: 'Server', category: 'cloud' },
  { value: 'network', icon: <TbNetwork />, label: 'Network', category: 'cloud' },
  { value: 'laptop', icon: <BsLaptopFill />, label: 'Infrastructure', category: 'cloud' },
  { value: 'microchip', icon: <FaMicrochip />, label: 'Hardware', category: 'cloud' },

  // DevOps
  { value: 'docker', icon: <FaDocker />, label: 'Docker', category: 'devops' },
  { value: 'kubernetes', icon: <SiKubernetes />, label: 'Kubernetes', category: 'devops' },
  { value: 'terraform', icon: <SiTerraform />, label: 'Terraform', category: 'devops' },
  { value: 'git', icon: <BsGit />, label: 'Git', category: 'devops' },
  { value: 'github', icon: <FaGithub />, label: 'GitHub', category: 'devops' },
  { value: 'kanban', icon: <BsKanban />, label: 'Kanban', category: 'devops' },

  // Security
  { value: 'security', icon: <MdSecurity />, label: 'Security', category: 'security' },
  { value: 'lock', icon: <TbLock />, label: 'Authentication', category: 'security' },
  { value: 'shield', icon: <TbShield />, label: 'Protection', category: 'security' },
  { value: 'bank', icon: <TbBuildingBank />, label: 'Compliance', category: 'security' },

  // Monitoring & Analytics
  { value: 'search', icon: <TbSearch />, label: 'Search', category: 'monitoring' },
  { value: 'chart', icon: <TbChartBar />, label: 'Analytics', category: 'monitoring' },
  { value: 'grafana', icon: <SiGrafana />, label: 'Grafana', category: 'monitoring' },
  { value: 'prometheus', icon: <SiPrometheus />, label: 'Prometheus', category: 'monitoring' }
]

export const getIconByValue = (value: AgentIcon, color?: string): React.ReactNode => {
  const option = AGENT_ICONS.find((opt) => opt.value === value)
  const icon = option?.icon || <TbRobot />
  if (color) {
    return React.cloneElement(icon as React.ReactElement, { style: { color } })
  }
  return icon
}

export const getIconsByCategory = (category: AgentIconOption['category']): AgentIconOption[] => {
  return AGENT_ICONS.filter((icon) => icon.category === category)
}
