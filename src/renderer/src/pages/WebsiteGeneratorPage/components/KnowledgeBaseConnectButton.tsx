/* eslint-disable react/prop-types */
import { BsDatabase, BsDatabaseCheck } from 'react-icons/bs'

type KnowledgeBaseConnectButtonProps = {
  enableKnowledgeBase: boolean
  handleOpenDataSourceConnectModal: () => void
}

export const KnowledgeBaseConnectButton: React.FC<KnowledgeBaseConnectButtonProps> = (props) => {
  const { enableKnowledgeBase, handleOpenDataSourceConnectModal } = props
  return (
    <button
      onClick={() => handleOpenDataSourceConnectModal()}
      className={`flex items-center justify-center p-[2px] overflow-hidden text-xs text-gray-900 rounded-lg group
        ${
          enableKnowledgeBase
            ? 'bg-gradient-to-br from-red-200 via-red-300 to-yellow-200 group-hover:from-red-200 group-hover:via-red-300 group-hover:to-yellow-200'
            : 'border border-gray-200 dark:border-gray-700'
        }
        dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-red-100 dark:focus:ring-red-400`}
    >
      <span
        className={`items-center px-3 py-1.5 transition-all ease-in duration-75 rounded-md flex gap-2
          ${
            enableKnowledgeBase
              ? 'bg-white dark:bg-gray-900 group-hover:bg-opacity-0'
              : 'bg-transparent'
          }`}
      >
        {enableKnowledgeBase ? (
          <BsDatabaseCheck className="text-sm" />
        ) : (
          <BsDatabase className="text-sm" />
        )}
        {enableKnowledgeBase ? 'Connected' : 'Connect'}
      </span>
    </button>
  )
}
