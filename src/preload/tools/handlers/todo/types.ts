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
