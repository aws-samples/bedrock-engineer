import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  ReactFlowProvider,
  Panel
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useAgentChat } from '../ChatPage/hooks/useAgentChat'
import { TextArea, AttachedImage } from '../ChatPage/components/InputForm/TextArea'
import useSetting from '@renderer/hooks/useSetting'
import { Loader } from '@renderer/components/Loader'
import { WebLoader } from '../../components/WebLoader'
import { DeepSearchButton } from '@renderer/components/DeepSearchButton'
import { motion } from 'framer-motion'
import { MdOutlineArticle, MdDownload, MdRefresh } from 'react-icons/md'
import { Tooltip } from 'flowbite-react'
import { extractFlowContent, isFlowComplete } from './utils/flowParser'
import { getLayoutedElements } from './utils/layoutEngine'
import { LoaderWithReasoning } from '../DiagramGeneratorPage/components/LoaderWithReasoning'
import { FlowExplanationView } from './components/FlowExplanationView'
import { CustomNodeTypes } from './components/CustomNodes'

const REACT_FLOW_SYSTEM_PROMPT = `
You are a React Flow flowchart generation expert. Based on user requirements, generate flowcharts in the following JSON format:

\`\`\`json
{
  "nodes": [
    {
      "id": "1",
      "type": "process",
      "position": { "x": 100, "y": 100 },
      "data": { "label": "Process Name" }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2",
      "label": "Condition"
    }
  ]
}
\`\`\`

Available node types:
- process: Regular process nodes
- decision: Decision/conditional nodes
- start: Starting point nodes
- end: Ending point nodes
- subprocess: Sub-process nodes

Please provide a brief explanation of the flowchart after the JSON.

Always respond in English for now.
`

export default function ReactFlowGeneratorPage() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  const [userInput, setUserInput] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const { currentLLM: llm, sendMsgKey, getAgentTools, enabledTavilySearch } = useSetting()

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])

  // Flow generation state
  const [flowHistory, setFlowHistory] = useState<
    { nodes: Node[]; edges: Edge[]; explanation: string; prompt: string }[]
  >([])
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null)

  // UI state
  const [showExplanation, setShowExplanation] = useState(true)
  const [flowExplanation, setFlowExplanation] = useState<string>('')
  const [streamingExplanation, setStreamingExplanation] = useState<string>('')
  const [enableSearch, setEnableSearch] = useState(false)

  // Generation state
  const [flowLoading, setFlowLoading] = useState(false)
  const [hasValidFlow, setHasValidFlow] = useState(false)

  // Flow generator agent ID
  const flowAgentId = 'reactFlowGeneratorAgent'

  // Tools configuration
  const flowAgentTools = useMemo(() => {
    const agentTools = getAgentTools(flowAgentId)
    if (enableSearch) {
      return agentTools.filter((tool) => tool.toolSpec?.name === 'tavilySearch' && tool.enabled)
    }
    return agentTools
  }, [enableSearch, getAgentTools, flowAgentId])

  const { messages, loading, handleSubmit, executingTool, latestReasoningText } = useAgentChat(
    llm?.modelId,
    REACT_FLOW_SYSTEM_PROMPT,
    flowAgentId,
    undefined,
    {
      enableHistory: false,
      tools: flowAgentTools
    }
  )

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Submit handler
  const onSubmit = (input: string, images?: AttachedImage[]) => {
    handleSubmit(input, images)
    setUserInput('')
    setSelectedHistoryIndex(null)
    setFlowLoading(true)
    setHasValidFlow(false)

    // Clear existing flow
    setNodes([])
    setEdges([])
    setFlowExplanation('')
  }

  // Handle streaming updates
  useEffect(() => {
    if (loading && messages.length > 0) {
      const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop()
      if (lastAssistantMessage?.content) {
        const currentText = lastAssistantMessage.content
          .map((c) => ('text' in c ? c.text : ''))
          .join('')

        setStreamingExplanation(currentText)

        // Try to extract and load flow during streaming
        if (flowLoading && !hasValidFlow) {
          const { nodes: extractedNodes, edges: extractedEdges } = extractFlowContent(currentText)

          if (extractedNodes.length > 0 && isFlowComplete(currentText)) {
            console.log('[DEBUG] Loading flow from streaming:', {
              nodesCount: extractedNodes.length,
              edgesCount: extractedEdges.length
            })

            // Apply auto-layout
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
              extractedNodes,
              extractedEdges
            )

            setNodes(layoutedNodes)
            setEdges(layoutedEdges)
            setHasValidFlow(true)
            setFlowLoading(false)
          }
        }
      }
    } else if (!loading) {
      setStreamingExplanation('')
      setFlowLoading(false)
      setHasValidFlow(false)
    }
  }, [messages, loading, flowLoading, hasValidFlow, setNodes, setEdges])

  // Handle completed generation
  useEffect(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop()
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()

    if (lastAssistantMessage?.content && !loading) {
      const rawContent = lastAssistantMessage.content
        .map((c) => ('text' in c ? c.text : ''))
        .join('')

      const { nodes: flowNodes, edges: flowEdges, explanation } = extractFlowContent(rawContent)

      if (flowNodes.length > 0) {
        // Apply auto-layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          flowNodes,
          flowEdges
        )

        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
        setFlowExplanation(explanation)

        // Add to history
        if (lastUserMessage?.content) {
          const userPrompt = lastUserMessage.content
            .map((c) => ('text' in c ? c.text : ''))
            .join('')
          setFlowHistory((prev) => {
            const newHistory = [
              ...prev,
              {
                nodes: layoutedNodes,
                edges: layoutedEdges,
                explanation,
                prompt: userPrompt
              }
            ]
            return newHistory.slice(-10) // Keep last 10
          })
        }
      }
    }
  }, [messages, loading, setNodes, setEdges])

  // Load flow from history
  const loadFlowFromHistory = (index: number) => {
    if (flowHistory[index]) {
      const historyItem = flowHistory[index]
      setNodes(historyItem.nodes)
      setEdges(historyItem.edges)
      setFlowExplanation(historyItem.explanation)
      setUserInput(historyItem.prompt)
      setSelectedHistoryIndex(index)
    }
  }

  // Auto-layout current flow
  const autoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [nodes, edges, setNodes, setEdges])

  // Export flow as image
  const exportAsImage = useCallback(() => {
    // This would implement image export functionality
    console.log('Export as image functionality would be implemented here')
  }, [])

  const toggleExplanationView = () => {
    setShowExplanation(!showExplanation)
  }

  return (
    <ReactFlowProvider>
      <div className="flex flex-col p-3 h-[calc(100vh-14rem)]">
        {/* Header */}
        <div className="flex pb-2 justify-between">
          <span className="font-bold flex flex-col gap-2 w-full">
            <div className="flex justify-between">
              <h1 className="content-center dark:text-white text-lg">React Flow Generator</h1>
            </div>
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                {flowHistory.map((_history, index) => (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    key={index}
                    className={`p-1 px-3 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 dark:text-white ${
                      selectedHistoryIndex === index
                        ? 'bg-gray-300 text-gray-800 dark:bg-gray-500 dark:text-white'
                        : 'bg-gray-200 text-gray-500 dark:bg-gray-600'
                    }`}
                    onClick={() => loadFlowFromHistory(index)}
                  >
                    {index + 1}
                  </motion.span>
                ))}
                {flowHistory.length === 0 && (
                  <span className="text-sm text-gray-800 dark:text-gray-400 font-medium">
                    Create interactive flowcharts with natural language. Generate process flows,
                    decision trees, and system diagrams.
                  </span>
                )}
              </div>
            </div>
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 rounded-lg">
          <div
            className="w-full h-[calc(calc(100vh-14rem)-5rem)] flex overflow-hidden"
            style={{
              gap: '1rem',
              backgroundColor: isDark
                ? 'rgb(17 24 39 / var(--tw-bg-opacity))'
                : 'rgb(243 244 246 / var(--tw-bg-opacity))',
              border: 'none'
            }}
          >
            {/* Flow Canvas - Left side */}
            <div className={`h-full ${showExplanation ? 'w-2/3' : 'w-full'} relative`}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={CustomNodeTypes}
                className={`bg-gray-50 dark:bg-gray-900 ${flowLoading || (loading && nodes.length === 0) ? 'opacity-50' : ''}`}
                fitView
              >
                <Background />
                <Controls />
                <MiniMap />
                <Panel position="top-right" className="flex gap-2">
                  <Tooltip content="Auto Layout">
                    <button
                      onClick={autoLayout}
                      className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      disabled={nodes.length === 0}
                    >
                      <MdRefresh className="text-lg" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Export Image">
                    <button
                      onClick={exportAsImage}
                      className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      disabled={nodes.length === 0}
                    >
                      <MdDownload className="text-lg" />
                    </button>
                  </Tooltip>
                </Panel>
              </ReactFlow>

              {/* Loading overlay */}
              {(flowLoading || (loading && nodes.length === 0)) && (
                <div className="absolute inset-0 flex h-full justify-center items-center flex-col bg-gray-50/90 dark:bg-gray-900/90">
                  <LoaderWithReasoning reasoningText={latestReasoningText} showProgress={false}>
                    {executingTool === 'tavilySearch' ? <WebLoader /> : <Loader />}
                  </LoaderWithReasoning>
                </div>
              )}
            </div>

            {/* Explanation View - Right side */}
            {showExplanation && (
              <div className="w-1/3 h-full">
                <FlowExplanationView
                  explanation={
                    loading && streamingExplanation
                      ? streamingExplanation
                      : flowExplanation || 'Flow explanation will appear here.'
                  }
                  isStreaming={loading && streamingExplanation.length > 0}
                  isVisible={showExplanation}
                  onClose={toggleExplanationView}
                  hasMessages={messages.length > 0}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 fixed bottom-0 left-[5rem] right-5 bottom-3">
          <div className="relative w-full">
            <div className="flex gap-2 justify-between pb-2">
              <div className="flex gap-3 items-center ml-auto">
                {enabledTavilySearch && (
                  <DeepSearchButton
                    enableDeepSearch={enableSearch}
                    handleToggleDeepSearch={() => setEnableSearch(!enableSearch)}
                  />
                )}
                <Tooltip content={showExplanation ? 'Hide Explanation' : 'Show Explanation'}>
                  <button
                    className={`cursor-pointer rounded-md py-1.5 px-2 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      showExplanation ? 'bg-gray-200 dark:bg-gray-700' : ''
                    }`}
                    onClick={toggleExplanationView}
                  >
                    <MdOutlineArticle className="text-xl" />
                  </button>
                </Tooltip>
              </div>
            </div>

            <TextArea
              value={userInput}
              onChange={setUserInput}
              disabled={loading}
              onSubmit={onSubmit}
              isComposing={isComposing}
              setIsComposing={setIsComposing}
              sendMsgKey={sendMsgKey}
            />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  )
}
