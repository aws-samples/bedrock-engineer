import path from 'path'
import fs from 'fs'
import Store from 'electron-store'
import { store } from '../../preload/store'

export interface TodoItem {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
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
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  description?: string
}

export interface TodoMetadata {
  id: string
  sessionId: string
  projectPath: string
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface TodoUpdateResult {
  success: boolean
  updatedList?: TodoList
  currentList?: TodoList
  error?: string
}

export class TodoSessionManager {
  private readonly todosDir: string
  private metadataStore: Store<{
    activeTodoListId?: string
    recentTodos: string[]
    metadata: { [key: string]: TodoMetadata }
  }>

  constructor() {
    const userDataPath = store.get('userDataPath')
    if (!userDataPath) {
      throw new Error('userDataPath is not set in store')
    }

    // TODOファイルを保存するディレクトリを作成
    this.todosDir = path.join(userDataPath, 'todos')
    fs.mkdirSync(this.todosDir, { recursive: true })

    // メタデータ用のストアを初期化
    this.metadataStore = new Store({
      name: 'todo-sessions-meta',
      defaults: {
        recentTodos: [] as string[],
        metadata: {} as { [key: string]: TodoMetadata }
      }
    })

    // 初回起動時またはメタデータが空の場合、既存のTODOリストからメタデータを生成
    this.initializeMetadata()
  }

  private initializeMetadata(): void {
    const metadata = this.metadataStore.get('metadata')
    if (Object.keys(metadata).length === 0) {
      try {
        const files = fs.readdirSync(this.todosDir)
        const todoFiles = files.filter((file) => file.endsWith('_todos.json'))

        for (const file of todoFiles) {
          const fileId = file.replace('_todos.json', '')
          const todoList = this.readTodoFile(fileId)
          if (todoList) {
            this.updateMetadata(fileId, todoList)
          }
        }

        console.log('Todo metadata initialized successfully')
      } catch (error) {
        console.error('Error initializing todo metadata:', error)
      }
    }
  }

  private getTodoFilePath(sessionId: string): string {
    // sessionIdが'session_'で始まっていない場合は追加
    const fileName = sessionId.startsWith('session_')
      ? `${sessionId}_todos.json`
      : `session_${sessionId}_todos.json`
    return path.join(this.todosDir, fileName)
  }

  private readTodoFile(sessionId: string): TodoList | null {
    const filePath = this.getTodoFilePath(sessionId)
    try {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data) as TodoList
    } catch (error) {
      console.error(`Error reading todo file ${sessionId}:`, error)
      return null
    }
  }

  private async writeTodoFile(sessionId: string, todoList: TodoList): Promise<void> {
    const filePath = this.getTodoFilePath(sessionId)
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(todoList, null, 2))
    } catch (error) {
      console.error(`Error writing todo file ${sessionId}:`, error)
    }
  }

  private updateMetadata(sessionId: string, todoList: TodoList): void {
    const metadata: TodoMetadata = {
      id: todoList.id,
      sessionId: todoList.sessionId,
      projectPath: todoList.projectPath,
      itemCount: todoList.items.length,
      createdAt: todoList.createdAt,
      updatedAt: todoList.updatedAt
    }

    const current = this.metadataStore.get('metadata')
    this.metadataStore.set('metadata', {
      ...current,
      [sessionId]: metadata
    })
  }

  async createTodoList(sessionId: string, projectPath: string, items: string[]): Promise<TodoList> {
    const todoId = `todolist-${Date.now()}`
    const now = new Date().toISOString()

    const todoList: TodoList = {
      id: todoId,
      items: items.map((description, index) => ({
        id: `task-${Date.now()}-${index}`,
        description,
        status: 'pending' as const,
        createdAt: now,
        updatedAt: now
      })),
      createdAt: now,
      updatedAt: now,
      sessionId,
      projectPath
    }

    await this.writeTodoFile(sessionId, todoList)
    this.updateMetadata(sessionId, todoList)
    this.updateRecentTodos(sessionId)

    return todoList
  }

  async updateTodoList(sessionId: string, updates: TodoItemUpdate[]): Promise<TodoUpdateResult> {
    try {
      const todoList = this.readTodoFile(sessionId)
      if (!todoList) {
        return {
          success: false,
          error: 'No todo list found. Please initialize a todo list first using todoInit.'
        }
      }

      const updatedItems = [...todoList.items]
      const now = new Date().toISOString()

      for (const update of updates) {
        const itemIndex = updatedItems.findIndex((item) => item.id === update.id)
        if (itemIndex === -1) {
          return {
            success: false,
            error: `Task with ID "${update.id}" not found`,
            currentList: todoList
          }
        }

        if (update.status) {
          updatedItems[itemIndex].status = update.status
        }
        if (update.description) {
          updatedItems[itemIndex].description = update.description
        }
        updatedItems[itemIndex].updatedAt = now
      }

      const updatedList: TodoList = {
        ...todoList,
        items: updatedItems,
        updatedAt: now
      }

      await this.writeTodoFile(sessionId, updatedList)
      this.updateMetadata(sessionId, updatedList)
      this.updateRecentTodos(sessionId)

      return {
        success: true,
        updatedList
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  getTodoList(sessionId: string): TodoList | null {
    return this.readTodoFile(sessionId)
  }

  deleteTodoList(sessionId: string): void {
    const filePath = this.getTodoFilePath(sessionId)
    try {
      fs.unlinkSync(filePath)

      // メタデータからも削除
      const metadata = this.metadataStore.get('metadata')
      delete metadata[sessionId]
      this.metadataStore.set('metadata', metadata)
    } catch (error) {
      console.error(`Error deleting todo file ${sessionId}:`, error)
    }

    const recentTodos = this.metadataStore.get('recentTodos')
    this.metadataStore.set(
      'recentTodos',
      recentTodos.filter((id) => id !== sessionId)
    )
  }

  private updateRecentTodos(sessionId: string): void {
    const recentTodos = this.metadataStore.get('recentTodos')
    const updated = [sessionId, ...recentTodos.filter((id) => id !== sessionId)].slice(0, 10)
    this.metadataStore.set('recentTodos', updated)
  }

  getRecentTodos(): TodoMetadata[] {
    const recentIds = this.metadataStore.get('recentTodos')
    const metadata = this.metadataStore.get('metadata')
    return recentIds
      .map((id) => metadata[id])
      .filter((meta): meta is TodoMetadata => {
        if (!meta) return false
        // TODOファイルが実際に存在することを確認
        const filePath = this.getTodoFilePath(meta.sessionId)
        return fs.existsSync(filePath)
      })
      .filter((meta) => meta.itemCount > 0)
  }

  getAllTodoMetadata(): TodoMetadata[] {
    const metadata = this.metadataStore.get('metadata')
    return Object.values(metadata)
      .filter((meta) => {
        // メタデータが存在し、対応するファイルも存在することを確認
        const filePath = this.getTodoFilePath(meta.sessionId)
        return fs.existsSync(filePath)
      })
      .filter((meta) => meta.itemCount > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  setActiveTodoList(sessionId: string | undefined): void {
    this.metadataStore.set('activeTodoListId', sessionId)
  }

  getActiveTodoListId(): string | undefined {
    return this.metadataStore.get('activeTodoListId')
  }
}
