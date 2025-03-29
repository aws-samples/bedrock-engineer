import React from 'react'
import { useTranslation } from 'react-i18next'
import { McpServerConfig } from '@/types/agent-chat'
import { parseServerConfigJson, generateSampleJson } from './utils/mcpServerUtils'
import { preventModalClose } from './utils/eventUtils'
import toast from 'react-hot-toast'

interface McpServerFormProps {
  mcpServers: McpServerConfig[]
  onChange: (servers: McpServerConfig[]) => void
  jsonInput: string
  setJsonInput: (value: string) => void
  jsonError: string | null
  setJsonError: (error: string | null) => void
  editMode: string | null
  setEditMode: (mode: string | null) => void
  autoTestOnAdd: boolean
  testServerConnection: (serverName: string, serverList?: McpServerConfig[]) => Promise<void>
}

/**
 * MCPサーバー追加/編集フォームコンポーネント
 */
export const McpServerForm: React.FC<McpServerFormProps> = ({
  mcpServers,
  onChange,
  jsonInput,
  setJsonInput,
  jsonError,
  setJsonError,
  editMode,
  setEditMode,
  autoTestOnAdd,
  testServerConnection
}) => {
  const { t } = useTranslation()

  // 追加ボタンクリック時に入力されたJSONを解析して追加
  const handleAddServer = async () => {
    const result = parseServerConfigJson(jsonInput, mcpServers)

    if (!result.success) {
      setJsonError(t(result.error || 'Invalid JSON format.'))
      return
    }

    // サーバー設定を追加
    const updatedServers = [...mcpServers, ...(result.servers || [])]
    onChange(updatedServers)

    // 入力欄をクリア
    setJsonInput('')
    setJsonError(null)

    // 成功メッセージ
    const count = result.servers?.length || 0
    toast.success(`${count} MCP server(s) added successfully`, {
      duration: 3000
    })

    // 自動接続テストが有効で、新しいサーバーが追加された場合
    if (autoTestOnAdd && result.servers && result.servers.length > 0) {
      // サーバーリストを安全に参照するためローカル変数に格納
      const serversToTest = [...result.servers]

      // 少し待ってからテストを実行（UIの更新が完了するのを待つ）
      setTimeout(() => {
        // 単一サーバーの場合は従来通り
        if (serversToTest.length === 1) {
          testServerConnection(serversToTest[0].name, updatedServers)
        }
        // 複数サーバーの場合は追加された全サーバーをテスト
        else {
          console.log(`Testing all ${serversToTest.length} newly added MCP servers...`)
          // 追加されたサーバーのみループでテスト
          for (const server of serversToTest) {
            testServerConnection(server.name, updatedServers)
          }
        }
      }, 500)
    }
  }

  // 編集内容保存
  const handleSaveEdit = () => {
    try {
      // JSONパース
      const serverConfig = JSON.parse(jsonInput)

      // 必須フィールドの検証
      if (
        !serverConfig.name ||
        !serverConfig.description ||
        !serverConfig.command ||
        !Array.isArray(serverConfig.args)
      ) {
        setJsonError(t('Required fields are missing or invalid. Check the JSON format.'))
        return
      }

      // envが指定されている場合はオブジェクト型であることを確認
      if (serverConfig.env && typeof serverConfig.env !== 'object') {
        setJsonError(t('The "env" field must be an object.'))
        return
      }

      // 名前が変更された場合の処理
      const newName = serverConfig.name
      if (newName !== editMode && mcpServers.some((server) => server.name === newName)) {
        setJsonError(t('A server with this new name already exists.'))
        return
      }

      // 新しい設定オブジェクトを作成
      const updatedServer: McpServerConfig = {
        name: newName,
        description: serverConfig.description || newName, // 説明がなければ名前を使用
        command: serverConfig.command,
        args: serverConfig.args,
        env: serverConfig.env || {}
      }

      // サーバー設定を更新
      onChange(mcpServers.map((server) => (server.name === editMode ? updatedServer : server)))

      // 編集モード終了
      setEditMode(null)
      setJsonInput('')
      setJsonError(null)

      // 成功メッセージ
      toast.success(t('Server updated successfully'), {
        duration: 3000
      })
    } catch (error) {
      setJsonError(t('Invalid JSON format.'))
    }
  }

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditMode(null)
    setJsonInput('')
    setJsonError(null)
  }

  return (
    <div
      className="flex flex-col gap-2 mt-4 border border-gray-200 dark:border-gray-700 p-4 rounded-md"
      onClick={preventModalClose}
    >
      <h4 className="font-medium text-sm mb-2">
        {editMode ? t('Edit MCP Server') : t('Add New MCP Server')}
      </h4>

      <div className="mt-2">
        <div className="flex justify-between items-center">
          <label
            htmlFor="jsonInput"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('Server Configuration (JSON)')}
          </label>
          <button
            type="button"
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setJsonInput(generateSampleJson())
            }}
          >
            {t('Set example mcp server')}
          </button>
        </div>
        <textarea
          id="jsonInput"
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value)
            if (jsonError) setJsonError(null)
          }}
          onClick={preventModalClose}
          className="mt-1 block w-full h-64 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
          placeholder={`{
  "mcpServers": {
    "my-mcp-server": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
      "env": { "VAR": "value" }
    }
  }
}`}
        />
        {jsonError && <p className="text-xs text-red-500 mt-1 whitespace-pre-line">{jsonError}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t(
            'Use claude_desktop_config.json format with mcpServers object containing server configurations.'
          )}
        </p>
      </div>

      <div className="flex gap-2">
        {editMode ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleCancelEdit()
              }}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {t('Cancel')}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSaveEdit()
              }}
              className="px-4 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {t('Update Server')}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleAddServer()
            }}
            className="px-4 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed mt-2 w-fit"
          >
            {t('Add Server')}
          </button>
        )}
      </div>
    </div>
  )
}
