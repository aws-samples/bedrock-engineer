import { ClockIcon } from '@heroicons/react/24/outline'

type HistoryButtonProps = {
  isActive: boolean
  onClick: () => void
}

export const HistoryButton: React.FC<HistoryButtonProps> = (props) => {
  const { isActive, onClick } = props
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center p-[2px] overflow-hidden text-xs text-gray-900 rounded-lg group
        ${
          isActive
            ? 'bg-gradient-to-br from-purple-200 via-purple-300 to-violet-200 group-hover:from-purple-200 group-hover:via-purple-300 group-hover:to-violet-200'
            : 'border border-gray-200 dark:border-gray-700'
        }
        dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-purple-100 dark:focus:ring-purple-400`}
    >
      <span
        className={`items-center px-3 py-1.5 transition-all ease-in duration-75 rounded-md flex gap-2
          ${isActive ? 'bg-white dark:bg-gray-900 group-hover:bg-opacity-0' : 'bg-transparent'}`}
      >
        <ClockIcon className="text-sm w-4 h-4" />
        History
      </span>
    </button>
  )
}
