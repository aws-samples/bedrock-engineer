import type {
  ActionGroupInvocationInput,
  ActionGroupInvocationOutput,
  GuardrailAssessment,
  InvocationInput,
  ModelInvocationInput,
  Observation,
  OrchestrationModelInvocationOutput,
  OrchestrationTrace,
  PostProcessingTrace,
  PreProcessingTrace,
  TracePart
} from '@aws-sdk/client-bedrock-agent-runtime'
import LocalImage from '@renderer/components/LocalImage'
import React from 'react'

interface Completion {
  message: string
  files: string[]
  traces: TracePart[]
}

interface InvokeAgentResult {
  $metadata: {
    httpStatusCode: number
    requestId: string
    attempts: number
    totalRetryDelay: number
  }
  contentType: string
  sessionId: string
  completion?: Completion
}

interface BedrockAgentResponse {
  success: boolean
  name: string
  message: string
  result: InvokeAgentResult
}

const GuardrailAssessmentView: React.FC<{ assessment: GuardrailAssessment }> = ({ assessment }) => {
  return (
    <div className="space-y-2">
      {assessment.topicPolicy && (
        <div>
          <h5 className="text-xs font-semibold text-yellow-400">Topic Policy</h5>
          <div className="text-xs text-gray-300">
            {assessment.topicPolicy.topics?.map((topic, index) => (
              <div key={index} className="flex gap-2">
                <span>{topic.name}:</span>
                <span>{topic.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment.contentPolicy && (
        <div>
          <h5 className="text-xs font-semibold text-yellow-400">Content Policy</h5>
          <div className="text-xs text-gray-300">
            {assessment.contentPolicy.filters?.map((filter, index) => (
              <div key={index} className="flex gap-2">
                <span>{filter.type}:</span>
                <span>{filter.action}</span>
                <span>({filter.confidence})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment.wordPolicy && (
        <div>
          <h5 className="text-xs font-semibold text-yellow-400">Word Policy</h5>
          <div className="text-xs text-gray-300">
            {assessment.wordPolicy.customWords?.map((word, index) => (
              <div key={index} className="flex gap-2">
                <span>Custom:</span>
                <span>{word.match}</span>
                <span>({word.action})</span>
              </div>
            ))}
            {assessment.wordPolicy.managedWordLists?.map((word, index) => (
              <div key={index} className="flex gap-2">
                <span>Managed:</span>
                <span>{word.match}</span>
                <span>({word.action})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment.sensitiveInformationPolicy && (
        <div>
          <h5 className="text-xs font-semibold text-yellow-400">Sensitive Information Policy</h5>
          <div className="text-xs text-gray-300">
            {assessment.sensitiveInformationPolicy.piiEntities?.map((entity, index) => (
              <div key={index} className="flex gap-2">
                <span>{entity.type}:</span>
                <span>{entity.action}</span>
              </div>
            ))}
            {assessment.sensitiveInformationPolicy.regexes?.map((regex, index) => (
              <div key={index} className="flex gap-2">
                <span>{regex.name}:</span>
                <span>{regex.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const InvocationInputView: React.FC<{ input: InvocationInput }> = ({ input }) => {
  return (
    <div className="space-y-2">
      <div className="text-gray-300">
        <span className="font-semibold">Type: </span>
        {input.invocationType}
      </div>

      {input.actionGroupInvocationInput && (
        <ActionGroupInvocationInputView input={input.actionGroupInvocationInput} />
      )}

      {input.knowledgeBaseLookupInput && (
        <div>
          <h5 className="text-xs font-semibold text-blue-400">Knowledge Base Lookup</h5>
          <div className="text-xs text-gray-300">
            <div>ID: {input.knowledgeBaseLookupInput.knowledgeBaseId}</div>
            <div>Query: {input.knowledgeBaseLookupInput.text}</div>
          </div>
        </div>
      )}

      {input.codeInterpreterInvocationInput && (
        <div>
          <h5 className="text-xs font-semibold text-blue-400">Code Interpreter</h5>
          <div className="text-xs text-gray-300 bg-gray-800 rounded-md p-2">
            <code className="whitespace-pre">{input.codeInterpreterInvocationInput.code}</code>
          </div>
        </div>
      )}
    </div>
  )
}

const ObservationView: React.FC<{ observation: Observation }> = ({ observation }) => {
  return (
    <div className="text-xs text-gray-300">
      <div>Type: {observation.type}</div>
      {observation.actionGroupInvocationOutput && (
        <ActionGroupInvocationOutputView output={observation.actionGroupInvocationOutput} />
      )}
      {observation.codeInterpreterInvocationOutput && (
        <div>{JSON.stringify(observation.codeInterpreterInvocationOutput)}</div>
      )}
      {observation.finalResponse && <div>{observation.finalResponse.text}</div>}
    </div>
  )
}

const ModelInvocationInputView: React.FC<{ modelInvocationInput: ModelInvocationInput }> = ({
  modelInvocationInput
}) => {
  return (
    <div className="text-xs text-gray-300">
      <div>Type: {modelInvocationInput.type}</div>
      <div className="whitespace-pre-wrap">{modelInvocationInput.text}</div>
    </div>
  )
}

const ModelInvocationOutputView: React.FC<{
  modelInvocationOutput: OrchestrationModelInvocationOutput
}> = ({ modelInvocationOutput }) => {
  return (
    <div className="text-xs text-gray-300">
      <div className="whitespace-pre-wrap">{modelInvocationOutput.rawResponse?.content}</div>
    </div>
  )
}

const ActionGroupInvocationInputView: React.FC<{ input: ActionGroupInvocationInput }> = ({
  input
}) => {
  return (
    <div>
      <h5 className="text-xs font-semibold text-green-400">Action Group Invocation</h5>
      <div className="text-xs text-gray-300">
        {input.actionGroupName && <div>Group: {input.actionGroupName}</div>}
        {input.apiPath && (
          <div>
            {input.verb} {input.apiPath}
          </div>
        )}
        {input.parameters && input.parameters.length > 0 && (
          <div>
            <span className="font-semibold">Parameters:</span>
            {input.parameters.map((param, index) => (
              <div key={index} className="ml-2">
                {param.name}: {param.value}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const ActionGroupInvocationOutputView: React.FC<{ output: ActionGroupInvocationOutput }> = ({
  output
}) => {
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold text-green-400">Action Output</h5>
      <div className="text-xs text-gray-300">
        <pre className="whitespace-pre-wrap">{output.text}</pre>
      </div>
    </div>
  )
}

const PreProcessingTraceView: React.FC<{ trace: PreProcessingTrace }> = ({ trace }) => {
  if ('modelInvocationInput' in trace) {
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-blue-400">Pre-Processing Input</h5>
        <div className="text-xs text-gray-300">
          <div>Text: {trace.modelInvocationInput?.text}</div>
          {trace.modelInvocationInput?.inferenceConfiguration && (
            <div className="mt-1">
              <div>
                Temperature: {trace.modelInvocationInput.inferenceConfiguration.temperature}
              </div>
              <div>TopP: {trace.modelInvocationInput.inferenceConfiguration.topP}</div>
              <div>TopK: {trace.modelInvocationInput.inferenceConfiguration.topK}</div>
              <div>
                StopSequences: {trace.modelInvocationInput.inferenceConfiguration.stopSequences}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if ('modelInvocationOutput' in trace) {
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-blue-400">Pre-Processing Output</h5>
        <div className="text-xs text-gray-300">
          {trace.modelInvocationOutput?.parsedResponse && (
            <>
              <div>Valid: {trace.modelInvocationOutput.parsedResponse.isValid ? 'Yes' : 'No'}</div>
              <div>Rationale: {trace.modelInvocationOutput.parsedResponse.rationale}</div>
            </>
          )}
        </div>
      </div>
    )
  }

  return null
}

const PostProcessingTraceView: React.FC<{ trace: PostProcessingTrace }> = ({ trace }) => {
  if ('modelInvocationInput' in trace) {
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-purple-400">Post-Processing Input</h5>
        <div className="text-xs text-gray-300">
          <div>Text: {trace.modelInvocationInput?.text}</div>
          {trace.modelInvocationInput?.inferenceConfiguration && (
            <div className="mt-1">
              <div>
                Temperature: {trace.modelInvocationInput.inferenceConfiguration.temperature}
              </div>
              <div>TopP: {trace.modelInvocationInput.inferenceConfiguration.topP}</div>
              <div>TopK: {trace.modelInvocationInput.inferenceConfiguration.topK}</div>
              <div>
                StopSequences: {trace.modelInvocationInput.inferenceConfiguration.stopSequences}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if ('modelInvocationOutput' in trace) {
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-purple-400">Post-Processing Output</h5>
        <div className="text-xs text-gray-300">
          {trace.modelInvocationOutput?.parsedResponse && (
            <div>{trace.modelInvocationOutput.parsedResponse.text}</div>
          )}
        </div>
      </div>
    )
  }

  return null
}

const OrchestrationTraceView: React.FC<{ trace: OrchestrationTrace }> = ({ trace }) => {
  if ('rationale' in trace) {
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-green-400">Rationale</h5>
        <div className="text-xs text-gray-300">{trace.rationale?.text}</div>
      </div>
    )
  }

  if ('invocationInput' in trace) {
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-green-400">Invocation Input</h5>
        <InvocationInputView input={trace.invocationInput as InvocationInput} />
      </div>
    )
  }

  if ('observation' in trace) {
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-green-400">Observation</h5>
        <ObservationView observation={trace.observation as Observation} />
      </div>
    )
  }

  if ('modelInvocationInput' in trace) {
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-green-400">Model Invocation Input</h5>
        <ModelInvocationInputView
          modelInvocationInput={trace.modelInvocationInput as ModelInvocationInput}
        />
      </div>
    )
  }

  if ('modelInvocationOutput' in trace) {
    return (
      <div className="space-y-2">
        <h5 className="text-xs font-semibold text-green-400">Model Invocation Output</h5>
        <ModelInvocationOutputView
          modelInvocationOutput={trace.modelInvocationOutput as OrchestrationModelInvocationOutput}
        />
      </div>
    )
  }

  return null
}

const TraceSection: React.FC<{ trace: TracePart }> = ({ trace }) => {
  const renderTraceContent = () => {
    if (!trace.trace) return null

    if (trace.trace.preProcessingTrace) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">Pre-Processing</h4>
          <PreProcessingTraceView trace={trace.trace.preProcessingTrace} />
        </div>
      )
    }

    if (trace.trace.orchestrationTrace) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-green-400 mb-2">Orchestration</h4>
          <OrchestrationTraceView trace={trace.trace.orchestrationTrace} />
        </div>
      )
    }

    if (trace.trace.postProcessingTrace) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-400 mb-2">Post-Processing</h4>
          <PostProcessingTraceView trace={trace.trace.postProcessingTrace} />
        </div>
      )
    }

    if (trace.trace.failureTrace) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-red-400 mb-2">Failure</h4>
          <div className="text-xs text-gray-300">
            <div>Reason: {trace.trace.failureTrace.failureReason}</div>
          </div>
        </div>
      )
    }

    if (trace.trace.guardrailTrace) {
      return (
        <div className="bg-gray-900 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Guardrail</h4>
          <div className="space-y-4">
            <div className="text-xs">
              <span className="text-gray-400">Action:</span>
              <span className="ml-2 text-gray-300">{trace.trace.guardrailTrace.action}</span>
            </div>

            {trace.trace.guardrailTrace.inputAssessments &&
              trace.trace.guardrailTrace.inputAssessments.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-yellow-400 mb-1">Input Assessments</h5>
                  {trace.trace.guardrailTrace.inputAssessments.map((assessment, index) => (
                    <GuardrailAssessmentView key={index} assessment={assessment} />
                  ))}
                </div>
              )}

            {trace.trace.guardrailTrace.outputAssessments &&
              trace.trace.guardrailTrace.outputAssessments.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-yellow-400 mb-1">Output Assessments</h5>
                  {trace.trace.guardrailTrace.outputAssessments.map((assessment, index) => (
                    <GuardrailAssessmentView key={index} assessment={assessment} />
                  ))}
                </div>
              )}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-4 text-sm">
        {trace.agentId && (
          <div>
            <span className="text-gray-400">Agent ID:</span>
            <span className="ml-2 text-gray-300">{trace.agentId}</span>
          </div>
        )}
        {trace.sessionId && (
          <div>
            <span className="text-gray-400">Session ID:</span>
            <span className="ml-2 text-gray-300">{trace.sessionId}</span>
          </div>
        )}
        {trace.agentVersion && (
          <div>
            <span className="text-gray-400">Version:</span>
            <span className="ml-2 text-gray-300">{trace.agentVersion}</span>
          </div>
        )}
      </div>
      {renderTraceContent()}
    </div>
  )
}

export const BedrockAgentResult: React.FC<{ response: BedrockAgentResponse }> = ({ response }) => {
  const { result } = response
  const completion = result.completion

  if (!completion) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> No completion data available.</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100 p-4 rounded-lg overflow-hidden shadow-sm border border-gray-700 dark:border-gray-800">
      {/* Message Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-200">Response</h3>
        <div className="bg-gray-900 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-300 whitespace-pre-wrap">{completion.message}</p>
        </div>
      </div>

      {/* Files Section - if any */}
      {completion.files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-200">Generated Files</h3>
          <div className="bg-gray-900 dark:bg-gray-800 p-4 rounded-lg">
            <ul className="grid lg:grid-cols-2 md:grid-cols-1 gap-2">
              {completion.files.map((filePath, index) => (
                <li key={index} className="h-full">
                  <div className="flex items-center space-x-2 p-2">
                    <span className="text-blue-400">📄</span>
                    <span className="text-gray-300">{filePath}</span>
                  </div>
                  <LocalImage src={filePath} alt={filePath} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Metadata Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-200">Metadata</h3>
        <div className="bg-gray-900 dark:bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Session ID:</span>
              <span className="ml-2 text-gray-300">{result.sessionId}</span>
            </div>
            <div>
              <span className="text-gray-400">Content Type:</span>
              <span className="ml-2 text-gray-300">{result.contentType}</span>
            </div>
            <div>
              <span className="text-gray-400">Status Code:</span>
              <span className="ml-2 text-gray-300">{result.$metadata.httpStatusCode}</span>
            </div>
            <div>
              <span className="text-gray-400">Request ID:</span>
              <span className="ml-2 text-gray-300">{result.$metadata.requestId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Traces Section */}
      {completion.traces.length > 0 && (
        <div className="space-y-2">
          <details>
            <summary className="text-sm font-bold text-gray-200">Traces</summary>
            <div className="space-y-4 mt-2">
              {completion.traces.map((trace, index) => (
                <TraceSection key={index} trace={trace} />
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
