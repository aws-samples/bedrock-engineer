import { KnowledgeBaseRetrievalResult } from '@aws-sdk/client-bedrock-agent-runtime'
import React, { useCallback } from 'react'
import { RetrievalResult } from './RetrievalResult'
import { TavilySearchResult } from './TavilySearch/TavilySearchResult'
import { ExecuteCommandResult } from './ExecuteCommand/ExecuteCommandResult'
import { GenerateImageResult } from './GenerateImage/GenerateImageResult'
import { BedrockAgentResult } from './BedrockAgent/BedrockAgentResult'
import { RecognizeImageResult } from './RecognizeImage/RecognizeImageResult'
import { CodeInterpreterResult } from './CodeInterpreter/CodeInterpreterResult'
import { ScreenCaptureResult } from './ScreenCapture/ScreenCaptureResult'
import { CameraCaptureResult } from './CameraCapture/CameraCaptureResult'
import { AsyncTaskCard, AsyncTaskInfo } from '../CodeInterpreter/AsyncTaskCard'

interface RetrieveResponse {
  success: boolean
  name: string
  message: string
  result: {
    $metadata: {
      httpStatusCode: number
      requestId: string
      attempts: number
      totalRetryDelay: number
    }
    retrievalResults: KnowledgeBaseRetrievalResult[]
  }
}

export const JSONCodeBlock: React.FC<{ json: any }> = ({ json }) => {
  // Check if the JSON contains async CodeInterpreter task info
  const isAsyncCodeInterpreterResult = useCallback((content: any): boolean => {
    try {
      if (typeof content === 'string') {
        const parsed = JSON.parse(content)
        return (
          parsed &&
          typeof parsed === 'object' &&
          'taskId' in parsed &&
          'status' in parsed &&
          'result' in parsed
        )
      }
      return (
        content &&
        typeof content === 'object' &&
        'taskId' in content &&
        'status' in content &&
        'result' in content
      )
    } catch {
      return false
    }
  }, [])

  // Convert JSON to AsyncTaskInfo
  const convertToAsyncTaskInfo = useCallback((content: any): AsyncTaskInfo => {
    const data = typeof content === 'string' ? JSON.parse(content) : content
    return {
      taskId: data.taskId,
      status: data.status,
      message: data.message || '',
      progress: data.progress,
      createdAt: data.result?.createdAt || new Date().toISOString(),
      startedAt: data.result?.startedAt,
      completedAt: data.result?.completedAt,
      executionResult: data.result?.executionResult
    }
  }, [])

  // Check if this is an async CodeInterpreter result first
  if (isAsyncCodeInterpreterResult(json)) {
    const taskInfo = convertToAsyncTaskInfo(json)
    return <AsyncTaskCard taskInfo={taskInfo} />
  }
  if (json.name === 'think') {
    return (
      <div className="max-h-[50vh] overflow-y-auto">
        <p className="text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
          {json?.result?.reasoning}
        </p>
      </div>
    )
  }

  if (json.name === 'tavilySearch') {
    return (
      <div className="max-h-[50vh] overflow-y-auto">
        <TavilySearchResult response={json} />
      </div>
    )
  }

  if (json.name === 'retrieve') {
    const retrieveResponse: RetrieveResponse = json
    return (
      <div className="max-h-[50vh] overflow-y-auto">
        {retrieveResponse.result.retrievalResults.map((retrievalResult, index) => (
          <RetrievalResult key={index} result={retrievalResult} />
        ))}
      </div>
    )
  }

  if (json.name === 'executeCommand') {
    return (
      <div className="max-h-[50vh] overflow-y-auto">
        <ExecuteCommandResult response={json} />
      </div>
    )
  }

  if (json.name === 'generateImage') {
    return <GenerateImageResult response={json} />
  }

  if (json.name === 'invokeBedrockAgent') {
    return (
      <div className="max-h-[50vh] overflow-y-auto">
        <BedrockAgentResult response={json} />
      </div>
    )
  }

  if (json.name === 'recognizeImage') {
    return <RecognizeImageResult response={json} />
  }

  if (json.name === 'screenCapture') {
    return <ScreenCaptureResult response={json} />
  }

  if (json.name === 'cameraCapture') {
    return <CameraCaptureResult response={json} />
  }

  if (json.name === 'codeInterpreter') {
    return (
      <div className="max-h-[60vh] overflow-y-auto">
        <CodeInterpreterResult response={json} />
      </div>
    )
  }

  const jsonStr = JSON.stringify(json, null, 2)
  return (
    <pre className="bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[50vh] max-w-[90vw] shadow-sm border border-gray-700 dark:border-gray-800">
      <code>{jsonStr}</code>
    </pre>
  )
}
