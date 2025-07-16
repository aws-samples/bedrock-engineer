import { IpcMainInvokeEvent } from 'electron'
import { TodoSessionManager, TodoItemUpdate } from '../store/todoSession'
import { log } from '../../common/logger'
import { store } from '../../preload/store'

// TodoSessionManagerのインスタンスを管理
let todoSessionManager: TodoSessionManager | null = null

function getTodoSessionManager(): TodoSessionManager {
  if (!todoSessionManager) {
    todoSessionManager = new TodoSessionManager()
  }
  return todoSessionManager
}

export const todoHandlers = {
  'todo-init': async (
    _event: IpcMainInvokeEvent,
    params: { sessionId: string; items: string[] }
  ) => {
    try {
      const { sessionId, items } = params
      const projectPath = store.get('projectPath') || require('os').homedir()

      log.info('Initializing todo list', {
        sessionId,
        itemCount: items.length,
        projectPath
      })

      const manager = getTodoSessionManager()
      const todoList = await manager.createTodoList(sessionId, projectPath, items)

      log.info('Todo list initialized successfully', {
        listId: todoList.id,
        itemCount: todoList.items.length,
        sessionId
      })

      return {
        success: true,
        result: todoList,
        message: `Todo list initialized with ${todoList.items.length} tasks`
      }
    } catch (error) {
      log.error('Failed to initialize todo list', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  },

  'todo-update': async (
    _event: IpcMainInvokeEvent,
    params: { sessionId: string; updates: TodoItemUpdate[] }
  ) => {
    try {
      const { sessionId, updates } = params

      log.info('Updating todo tasks', {
        sessionId,
        updateCount: updates.length
      })

      const manager = getTodoSessionManager()
      const result = await manager.updateTodoList(sessionId, updates)

      if (result.success) {
        log.info('Todo tasks updated successfully', {
          sessionId,
          updateCount: updates.length
        })
      } else {
        log.warn('Todo update failed', {
          sessionId,
          error: result.error
        })
      }

      return result
    } catch (error) {
      log.error('Failed to update todo tasks', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  },

  'get-todo-list': async (_event: IpcMainInvokeEvent, params?: { sessionId?: string }) => {
    try {
      if (!params?.sessionId) {
        log.debug('No session ID provided for TODO list retrieval')
        return null
      }

      const manager = getTodoSessionManager()
      const todoList = manager.getTodoList(params.sessionId)

      log.debug('Retrieved TODO list from store', {
        todoList: todoList ? { id: todoList.id, itemCount: todoList.items.length } : null,
        sessionId: params.sessionId,
        found: !!todoList
      })

      return todoList
    } catch (error) {
      log.error('Error retrieving TODO list', {
        error: error instanceof Error ? error.message : String(error),
        params
      })
      return null
    }
  },

  'delete-todo-list': async (_event: IpcMainInvokeEvent, params: { sessionId: string }) => {
    try {
      const { sessionId } = params

      log.info('Deleting todo list', { sessionId })

      const manager = getTodoSessionManager()
      manager.deleteTodoList(sessionId)

      log.info('Todo list deleted successfully', { sessionId })

      return { success: true }
    } catch (error) {
      log.error('Failed to delete todo list', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  },

  'get-recent-todos': async (_event: IpcMainInvokeEvent) => {
    try {
      const manager = getTodoSessionManager()
      const recentTodos = manager.getRecentTodos()

      log.debug('Retrieved recent todos', {
        count: recentTodos.length
      })

      return recentTodos
    } catch (error) {
      log.error('Error retrieving recent todos', {
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  },

  'get-all-todo-metadata': async (_event: IpcMainInvokeEvent) => {
    try {
      const manager = getTodoSessionManager()
      const allTodos = manager.getAllTodoMetadata()

      log.debug('Retrieved all todo metadata', {
        count: allTodos.length
      })

      return allTodos
    } catch (error) {
      log.error('Error retrieving all todo metadata', {
        error: error instanceof Error ? error.message : String(error)
      })
      return []
    }
  },

  'set-active-todo-list': async (_event: IpcMainInvokeEvent, params: { sessionId?: string }) => {
    try {
      const { sessionId } = params

      const manager = getTodoSessionManager()
      manager.setActiveTodoList(sessionId)

      log.debug('Set active todo list', { sessionId })

      return { success: true }
    } catch (error) {
      log.error('Failed to set active todo list', {
        error: error instanceof Error ? error.message : String(error),
        params
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  },

  'get-active-todo-list-id': async (_event: IpcMainInvokeEvent) => {
    try {
      const manager = getTodoSessionManager()
      const activeId = manager.getActiveTodoListId()

      log.debug('Retrieved active todo list ID', { activeId })

      return activeId
    } catch (error) {
      log.error('Error retrieving active todo list ID', {
        error: error instanceof Error ? error.message : String(error)
      })
      return null
    }
  }
} as const
