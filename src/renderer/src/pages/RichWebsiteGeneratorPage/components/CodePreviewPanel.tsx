import {
  SandpackLayout,
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackFiles
} from '@codesandbox/sandpack-react'
import { ViewToggle } from './ViewToggle'
import { Preview } from '../../WebsiteGeneratorPage/components/Preview'
import { getLoaderComponent } from '../utils/loaderUtils'

// Layout constants
const LAYOUT_CONSTANTS = {
  FILE_EXPLORER_WIDTH: '250px'
} as const

interface CodePreviewPanelProps {
  activeTab: 'code' | 'preview'
  onTabChange: (tab: 'code' | 'preview') => void
  isChatPanelVisible: boolean
  onToggleChatPanel: () => void
  files: SandpackFiles
  loading: boolean
  isDark: boolean
  code: string
  previewKey: number
  executingTools: Set<string>
  latestReasoningText: string
}

export function CodePreviewPanel({
  activeTab,
  onTabChange,
  isChatPanelVisible,
  onToggleChatPanel,
  files,
  loading,
  isDark,
  code,
  previewKey,
  executingTools,
  latestReasoningText
}: CodePreviewPanelProps) {
  return (
    <div className="flex flex-col flex-1 min-w-0 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out">
      {/* Tab Header */}
      <div className="flex items-center p-2 border-b dark:border-gray-700">
        <ViewToggle
          activeView={activeTab}
          onViewChange={onTabChange}
          isChatPanelVisible={isChatPanelVisible}
          onToggleChatPanel={onToggleChatPanel}
          files={files}
          loading={loading}
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'code' ? (
          <SandpackLayout
            style={{
              height: '100%',
              backgroundColor: isDark
                ? 'rgb(17 24 39 / var(--tw-bg-opacity))'
                : 'rgb(243 244 246 / var(--tw-bg-opacity))',
              border: 'none'
            }}
          >
            <SandpackFileExplorer
              style={{
                height: '100%',
                minWidth: LAYOUT_CONSTANTS.FILE_EXPLORER_WIDTH,
                maxWidth: LAYOUT_CONSTANTS.FILE_EXPLORER_WIDTH
              }}
            />
            <SandpackCodeEditor
              style={{
                height: '100%',
                flex: 1
              }}
              showInlineErrors={true}
              showTabs={true}
              showLineNumbers
              showRunButton={true}
            />
          </SandpackLayout>
        ) : loading ? (
          <div className="flex w-full h-full justify-center items-center">
            {getLoaderComponent(
              executingTools.size > 0 ? Array.from(executingTools)[0] : null,
              latestReasoningText
            )}
          </div>
        ) : (
          <div className="h-full" key={previewKey}>
            <Preview isDark={isDark} code={code} />
          </div>
        )}
      </div>
    </div>
  )
}
