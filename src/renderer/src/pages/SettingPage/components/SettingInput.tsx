import React, { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

interface SettingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
}

export const SettingInput: React.FC<SettingInputProps> = ({
  label,
  description,
  error,
  className,
  ...inputProps
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = inputProps.type === 'password'

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">{label}</label>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      <div className="relative">
        <input
          {...inputProps}
          value={inputProps.value ?? ''}
          type={!showPassword ? inputProps.type : 'text'}
          className={`
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-white
            text-sm rounded-lg
            focus:ring-blue-500 dark:focus:ring-blue-500
            focus:border-blue-500 dark:focus:border-blue-500
            block w-full p-2.5
            ${error ? 'border-red-500 dark:border-red-500' : ''}
            ${className || ''}
          `}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
    </div>
  )
}
