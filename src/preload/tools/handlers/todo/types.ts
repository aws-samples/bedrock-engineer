/**
 * Types for Todo tools
 */

export type TodoItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface TodoItem {
  id: string
  description: string
  status: TodoItemStatus
  createdAt: string
  updatedAt: string
}

export interface TodoList {
  id: string
  items: TodoItem[]
  createdAt: string
  updatedAt: string
  sessionId: string
  projectPath: string
}

export interface TodoItemUpdate {
  id: string
  status?: TodoItemStatus
  description?: string
}

export interface TodoUpdateResult {
  success: boolean
  updatedList?: TodoList
  currentList?: TodoList
  error?: string
}

/**
 * Input types for todo tools
 */
export interface TodoInitInput {
  type: 'todoInit'
  items: string[]
}

export interface TodoUpdateInput {
  type: 'todoUpdate'
  updates: TodoItemUpdate[]
}

/**
 * File management utilities
 */
export function getTodoFilePath(projectPath: string, sessionId: string): string {
  const path = require('path')
  // Check if sessionId already starts with 'session_' to avoid duplication
  const fileName = sessionId.startsWith('session_')
    ? `${sessionId}_todos.json`
    : `session_${sessionId}_todos.json`
  return path.join(projectPath, '.bedrock-engineer', 'todos', fileName)
}

export function getTodosDirectoryPath(projectPath: string): string {
  const path = require('path')
  return path.join(projectPath, '.bedrock-engineer', 'todos')
}

export function getGitignoreFilePath(projectPath: string): string {
  const path = require('path')
  return path.join(projectPath, '.bedrock-engineer', 'todos', '.gitignore')
}

/**
 * Utility functions
 */
export function generateTodoId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function formatTodoList(todoList: TodoList): string {
  if (!todoList.items.length) {
    return '## Todo List\n\n_No tasks available._'
  }

  const lines = ['## Todo List', '']

  todoList.items.forEach((item, index) => {
    const statusIcon = getStatusIcon(item.status)
    const statusText = getStatusText(item.status)

    lines.push(`${index + 1}. **${statusIcon} ${item.description}** _(${statusText})_`)
    lines.push(`   - ID: \`${item.id}\``)
    lines.push(`   - Status: ${item.status}`)
    lines.push(`   - Updated: ${new Date(item.updatedAt).toLocaleString()}`)
    lines.push('')
  })

  return lines.join('\n')
}

function getStatusIcon(status: TodoItemStatus): string {
  switch (status) {
    case 'pending':
      return '⏳'
    case 'in_progress':
      return '🔄'
    case 'completed':
      return '✅'
    case 'cancelled':
      return '❌'
    default:
      return '❓'
  }
}

function getStatusText(status: TodoItemStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'in_progress':
      return 'In Progress'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}
