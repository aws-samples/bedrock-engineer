import { KnowledgeBaseRetrievalResult } from '@aws-sdk/client-bedrock-agent-runtime'
import React from 'react'
import { RetrievalResult } from './RetrievalResult'
import { TavilySearchResult } from './TavilySearch/TavilySearchResult'
import { ExecuteCommandResult } from './ExecuteCommand/ExecuteCommandResult'
import { GenerateImageResult } from './GenerateImage/GenerateImageResult'
import { BedrockAgentResult } from './BedrockAgent/BedrockAgentResult'
import { RecognizeImageResult } from './RecognizeImage/RecognizeImageResult'

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

  const jsonStr = JSON.stringify(json, null, 2)
  return (
    <pre className="bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[50vh] max-w-[90vw] shadow-sm border border-gray-700 dark:border-gray-800">
      <code>{jsonStr}</code>
    </pre>
  )
}
