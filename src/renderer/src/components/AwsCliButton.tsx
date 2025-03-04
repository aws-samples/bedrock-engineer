import { FaAws } from 'react-icons/fa'

interface AwsCliButtonProps {
  enableAwsCli: boolean
  handleToggleAwsCli: () => void
}

export const AwsCliButton = ({ enableAwsCli, handleToggleAwsCli }: AwsCliButtonProps) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleAwsCli}
        className={`flex items-center justify-center p-[2px] overflow-hidden text-xs text-gray-900 rounded-lg group
          ${
            enableAwsCli
              ? 'bg-gradient-to-br from-red-200 via-red-300 to-yellow-200 group-hover:from-red-200 group-hover:via-red-300 group-hover:to-yellow-200'
              : 'border border-gray-200 dark:border-gray-700'
          }
          dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-blue-100 dark:focus:ring-blue-400`}
      >
        <span
          className={`items-center px-3 py-1.5 transition-all ease-in duration-75 rounded-md flex gap-2
          ${
            enableAwsCli ? 'bg-white dark:bg-gray-900 group-hover:bg-opacity-0' : 'bg-transparent'
          }`}
        >
          <FaAws className="text-lg" />
          {enableAwsCli ? 'Connected' : 'Connect'}
        </span>
      </button>
    </div>
  )
}
