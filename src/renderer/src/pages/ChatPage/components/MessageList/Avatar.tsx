import type { ConversationRole } from '@aws-sdk/client-bedrock-runtime'
import React from 'react'
import { LiaUserCircleSolid } from 'react-icons/lia'
import AILogo from '@renderer/assets/images/icons/ai.svg'

export const Avatar: React.FC<{ role?: ConversationRole }> = ({ role }) => {
  const renderAvatar = (role?: ConversationRole) => {
    if (role === 'assistant') {
      return (
        <div className="h-8 w-8 flex justify-center items-center">
          <div className="h-4 w-4">
            <AILogo />
          </div>
        </div>
      )
    } else {
      return (
        <div className="flex justify-center items-center">
          <LiaUserCircleSolid className="h-6 w-6" />
        </div>
      )
    }
  }

  return (
    <div className="flex items-center justify-center w-10 h-10 dark:text-white">
      {renderAvatar(role)}
    </div>
  )
}
