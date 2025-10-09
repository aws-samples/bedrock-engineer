import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { McpServerConfig } from '@/types/agent-chat'
import { parseServerConfigJson, generateSampleJson } from './utils/mcpServerUtils'
import { preventModalClose } from './utils/eventUtils'
import toast from 'react-hot-toast'
import { MonacoJSONEditor } from '@renderer/components/common/MonacoJSONEditor'

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
  // エディタモード（simple: textarea, rich: Monaco Editor）
  const [editorMode, setEditorMode] = useState<'simple' | 'rich'>('simple')

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
    // 編集中のサーバーを除外したサーバーリストを作成（重複チェック用）
    const serversExcludingEditTarget = mcpServers.filter((server) => server.name !== editMode)

    // parseServerConfigJson を使用して入力されたJSONを解析
    const result = parseServerConfigJson(jsonInput, serversExcludingEditTarget)

    if (!result.success) {
      setJsonError(t(result.error || 'Invalid JSON format.'))
      return
    }

    if (!result.servers || result.servers.length === 0) {
      setJsonError(t('No valid server configurations found'))
      return
    }

    // 複数サーバーが含まれている場合の処理
    if (result.servers.length > 1) {
      // 編集対象サーバーを削除し、新しいサーバー設定を追加
      const updatedServers = [...serversExcludingEditTarget, ...result.servers]
      onChange(updatedServers)

      // 成功メッセージ
      toast.success(t('Multiple servers updated successfully'), {
        duration: 3000
      })
    } else {
      // 単一サーバーの場合は従来通りの更新
      const updatedServer = result.servers[0]
      const updatedServers = mcpServers.map((server) =>
        server.name === editMode ? updatedServer : server
      )
      onChange(updatedServers)

      // 成功メッセージ
      toast.success(t('Server updated successfully'), {
        duration: 3000
      })
    }

    // 編集モード終了
    setEditMode(null)
    setJsonInput('')
    setJsonError(null)
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
      <h4 className="font-medium text-sm mb-2 dark:text-gray-300">
        {editMode ? t('Edit MCP Server') : t('Add New MCP Server')}
      </h4>

      <div className="mt-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="jsonInput"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('Server Configuration (JSON)')}
          </label>
          <div className="ml-2">
            <button
              type="button"
              onClick={() => setEditorMode(editorMode === 'simple' ? 'rich' : 'simple')}
              className="inline-flex items-center justify-center flex gap-1"
              title={
                editorMode === 'simple' ? t('Switch to rich editor') : t('Switch to simple editor')
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-5 h-5 ${
                  editorMode === 'rich'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                } hover:text-blue-500`}
              >
                <path
                  fillRule="evenodd"
                  d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm4.5-1.06a.75.75 0 10-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25a.75.75 0 000-1.06l-2.25-2.25z"
                  clipRule="evenodd"
                />
              </svg>

              <p className="text-gray-700">{editorMode} editor</p>
            </button>
          </div>
        </div>

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
        {editorMode === 'simple' ? (
          <textarea
            id="jsonInput"
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value)
              if (jsonError) setJsonError(null)
            }}
            onClick={preventModalClose}
            className="mt-1 block w-full h-64 px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
            placeholder={`{
  "mcpServers": {
    "my-mcp-server": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
      "env": { "VAR": "value" }
    },
    "api-server": {
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer your-token-here",
        "X-API-Key": "your-api-key"
      }
    }
  }
}`}
          />
        ) : (
          <MonacoJSONEditor
            value={jsonInput}
            onChange={(value) => {
              setJsonInput(value)
              if (jsonError) setJsonError(null)
            }}
            onValidate={
              // リアルタイムバリデーションが必要な場合はここで設定
              // 今回は送信時にのみエラーチェックするので、何もしない
              () => {}
            }
            height="300px"
            className="mt-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
          />
        )}
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
