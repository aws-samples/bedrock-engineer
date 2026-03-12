import type { KnowledgeBaseRetrievalResult } from '@aws-sdk/client-bedrock-agent-runtime'
import React from 'react'

interface Props {
  result: KnowledgeBaseRetrievalResult
}

export const RetrievalResult: React.FC<Props> = ({ result }) => {
  const { content, location, score, metadata } = result

  const handleUrlClick = (url: string) => {
    open(url)
  }

  const formatContent = () => {
    if (!content) return null
    return (
      <div className="mb-4">
        {/* Content with Score Badge */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Content</h4>
          {typeof score !== 'undefined' && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded whitespace-nowrap">
              {(score * 100).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{content.text}</p>
        </div>
      </div>
    )
  }

  const formatLocation = () => {
    if (!location) return null
    return (
      <div className="mb-4">
        <h4 className="text-sm font-bold mb-2 text-gray-900 dark:text-white">Source Location</h4>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-start">
              <span className="font-medium mr-2 text-gray-700 dark:text-gray-300 w-16 shrink-0">
                Type:
              </span>
              <span className="text-gray-600 dark:text-gray-400">{location.type}</span>
            </div>

            {/* S3 Location */}
            {location.s3Location && (
              <div className="flex items-start">
                <span className="font-medium mr-2 text-gray-700 dark:text-gray-300 w-16 shrink-0">
                  S3 URI:
                </span>
                <span className="break-all text-gray-600 dark:text-gray-400">
                  {location.s3Location.uri}
                </span>
              </div>
            )}

            {/* Web Location */}
            {location.webLocation && (
              <div className="flex items-start">
                <span className="font-medium mr-2 text-gray-700 dark:text-gray-300 w-16 shrink-0">
                  URL:
                </span>
                <span
                  className="break-all text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  onClick={() => handleUrlClick(location.webLocation?.url || '')}
                >
                  {location.webLocation.url}
                </span>
              </div>
            )}

            {/* Confluence Location */}
            {location.confluenceLocation?.url && (
              <div className="flex items-start">
                <span className="font-medium mr-2 text-gray-700 dark:text-gray-300 w-16 shrink-0">
                  URL:
                </span>
                <span
                  className="break-all text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  onClick={() => handleUrlClick(location.confluenceLocation?.url || '')}
                >
                  {location.confluenceLocation.url}
                </span>
              </div>
            )}

            {/* Salesforce Location */}
            {location.salesforceLocation?.url && (
              <div className="flex items-start">
                <span className="font-medium mr-2 text-gray-700 dark:text-gray-300 w-16 shrink-0">
                  URL:
                </span>
                <span
                  className="break-all text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  onClick={() => handleUrlClick(location.salesforceLocation?.url || '')}
                >
                  {location.salesforceLocation.url}
                </span>
              </div>
            )}

            {/* SharePoint Location */}
            {location.sharePointLocation?.url && (
              <div className="flex items-start">
                <span className="font-medium mr-2 text-gray-700 dark:text-gray-300 w-16 shrink-0">
                  URL:
                </span>
                <span
                  className="break-all text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  onClick={() => handleUrlClick(location.sharePointLocation?.url || '')}
                >
                  {location.sharePointLocation.url}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const formatMetadata = () => {
    if (!metadata || Object.keys(metadata).length === 0) return null
    return (
      <div className="mb-4">
        <h4 className="text-sm font-bold mb-2 text-gray-900 dark:text-white">Metadata</h4>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap break-words text-xs text-gray-700 dark:text-gray-300">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 p-4 mb-4">
      {formatContent()}
      {formatLocation()}
      {formatMetadata()}
    </div>
  )
}
