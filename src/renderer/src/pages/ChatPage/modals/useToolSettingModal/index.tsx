import { useSettings } from '@renderer/contexts/SettingsContext'
import toast from 'react-hot-toast'
import { ToolName } from '@/types/tools'
import { toolIcons } from '../../components/Tool/ToolIcons'
import { KnowledgeBaseSettingForm } from './KnowledgeBaseSettingForm'
import { CommandForm } from './CommandForm'
import { BedrockAgentSettingForm } from './BedrockAgentSettingForm'
import { Modal } from 'flowbite-react'
import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BedrockAgent } from '@/types/agent'

export interface CommandConfig {
  pattern: string
  description: string
}

// 利用可能なシェルのリスト
export const AVAILABLE_SHELLS = [
  { value: '/bin/bash', label: 'Bash' },
  { value: '/bin/zsh', label: 'Zsh' },
  { value: '/bin/sh', label: 'Shell' }
]

// 全幅で表示するツール名のリスト
const FULL_WIDTH_TOOLS = ['executeCommand', 'retrieve', 'invokeBedrockAgent'] as const

interface ToolSettingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ToolCardProps {
  toolName: string
  enabled: boolean
  onClick: () => void
  children?: React.ReactNode
}

const ToolCard: React.FC<ToolCardProps> = ({ toolName, enabled, onClick, children }) => {
  const { t } = useTranslation()

  return (
    <div
      className={`
        p-4 rounded-lg
        border-2 transition-all duration-200
        ${enabled ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
        hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-grow cursor-pointer" onClick={onClick}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">{toolIcons[toolName as ToolName]}</div>
            <div>
              <span
                className={`
                  text-sm font-medium
                  ${
                    enabled
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-300'
                  }
                `}
              >
                {toolName === 'retrieve' ? 'retrieve (from Bedrock Knowledge Base)' : toolName}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t(`tool descriptions.${toolName}`)}
              </p>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

export const useToolSettingModal = () => {
  const [show, setShow] = useState(false)
  const handleOpen = () => {
    setShow(true)
  }
  const handleClose = () => {
    setShow(false)
  }

  return {
    show: show,
    handleOpen: handleOpen,
    handleClose: handleClose,
    ToolSettingModal: ToolSettingModal
  }
}

const ToolSettingModal = memo(({ isOpen, onClose }: ToolSettingModalProps) => {
  const { t } = useTranslation()
  const {
    tools,
    setTools,
    currentLLM,
    knowledgeBases,
    setKnowledgeBases,
    allowedCommands,
    setAllowedCommands,
    shell,
    setShell,
    bedrockAgents = [],
    setBedrockAgents = (agents: BedrockAgent[]) => {
      window.store.set('bedrockAgents', agents)
    }
  } = useSettings()

  const handleClickEnableTool = (toolName: string) => {
    if (!tools) return

    if (!currentLLM.toolUse) {
      toast(`${currentLLM.modelName} does not support ToolUse.`)
      return
    }

    const updatedTools = tools.map((tool) => {
      if (tool.toolSpec?.name === toolName) {
        return { ...tool, enabled: !tool.enabled }
      }
      return tool
    })
    setTools(updatedTools)
  }

  // ツールを標準サイズとフルワイドサイズに分類
  const { standardTools, fullWidthTools } = tools?.reduce(
    (acc, tool) => {
      const toolName = tool.toolSpec?.name
      if (!toolName) return acc

      if (FULL_WIDTH_TOOLS.includes(toolName as (typeof FULL_WIDTH_TOOLS)[number])) {
        acc.fullWidthTools.push(tool)
      } else {
        acc.standardTools.push(tool)
      }
      return acc
    },
    { standardTools: [], fullWidthTools: [] } as {
      standardTools: typeof tools
      fullWidthTools: typeof tools
    }
  ) ?? { standardTools: [], fullWidthTools: [] }

  return (
    <Modal dismissible size="8xl" show={isOpen} onClose={onClose}>
      <Modal.Header>{t('Available Tools')}</Modal.Header>
      <Modal.Body>
        <p className="text-gray-700 text-sm pb-4 dark:text-white">{t('Choose the tools')}</p>

        {/* 標準サイズのツール */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 mb-4">
          {standardTools.map((tool) => {
            const toolName = tool.toolSpec?.name
            if (!toolName) return null

            return (
              <ToolCard
                key={toolName}
                toolName={toolName}
                enabled={tool.enabled}
                onClick={() => handleClickEnableTool(toolName)}
              />
            )
          })}
        </div>

        {/* フルワイドサイズのツール */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {fullWidthTools.map((tool) => {
            const toolName = tool.toolSpec?.name
            if (!toolName) return null

            return (
              <ToolCard
                key={toolName}
                toolName={toolName}
                enabled={tool.enabled}
                onClick={() => handleClickEnableTool(toolName)}
              >
                {toolName === 'retrieve' && tool.enabled && (
                  <KnowledgeBaseSettingForm
                    knowledgeBases={knowledgeBases}
                    setKnowledgeBases={setKnowledgeBases}
                  />
                )}
                {toolName === 'executeCommand' && tool.enabled && (
                  <CommandForm
                    allowedCommands={allowedCommands}
                    setAllowedCommands={setAllowedCommands}
                    shell={shell}
                    setShell={setShell}
                  />
                )}
                {toolName === 'invokeBedrockAgent' && tool.enabled && (
                  <BedrockAgentSettingForm
                    bedrockAgents={bedrockAgents}
                    setBedrockAgents={setBedrockAgents}
                  />
                )}
              </ToolCard>
            )
          })}
        </div>
      </Modal.Body>
    </Modal>
  )
})

ToolSettingModal.displayName = 'ToolSettingModal'

export default ToolSettingModal
