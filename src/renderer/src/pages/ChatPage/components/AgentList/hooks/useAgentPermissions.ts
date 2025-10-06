import { CustomAgent } from '@/types/agent-chat'

export const useAgentPermissions = (agent: CustomAgent) => {
  const isCustomAgent = agent.isCustom ?? true
  const isEditable = isCustomAgent && !agent.isShared
  const canDelete = isEditable
  const canEdit = isEditable
  const canShare = isEditable

  return {
    isCustomAgent,
    isEditable,
    canDelete,
    canEdit,
    canShare
  }
}
