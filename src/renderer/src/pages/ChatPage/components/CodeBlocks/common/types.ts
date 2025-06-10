/**
 * Common types for tool result components
 */

import { ReactNode } from 'react'

/**
 * Base tool result interface
 */
export interface BaseToolResult {
  success: boolean
  name: string
  message: string
  error?: string
}

/**
 * Props for ToolResultHeader component
 */
export interface ToolResultHeaderProps {
  success: boolean
  toolName: string
  title: string
  subtitle?: string
  error?: string
  icon?: ReactNode
  children?: ReactNode
}

/**
 * Props for StatisticsBadge component
 */
export interface StatisticsBadgeProps {
  label: string
  value: string | number
  change?: {
    from: string | number
    to: string | number
  }
  unit?: string
}

/**
 * Props for ContentPreview component
 */
export interface ContentPreviewProps {
  content: string
  maxLines?: number
  language?: string
  fileName?: string
  collapsible?: boolean
  defaultExpanded?: boolean
}

/**
 * Props for PathDisplay component
 */
export interface PathDisplayProps {
  path: string
  type?: 'file' | 'folder'
  truncate?: boolean
  copyable?: boolean
}

/**
 * Props for file operation results
 */
export interface FileOperationResultProps {
  source?: string
  destination?: string
  operation: 'move' | 'copy'
}
