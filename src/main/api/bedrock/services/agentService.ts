import {
  RetrieveAndGenerateCommand,
  RetrieveAndGenerateCommandInput,
  RetrieveCommand,
  AgenticRetrieveStreamCommand,
  RetrieveCommandInput,
  InvokeAgentCommand,
  InvokeAgentCommandInput,
  InvokeAgentCommandOutput,
  ResponseStream,
  TracePart
} from '@aws-sdk/client-bedrock-agent-runtime'
import { createAgentRuntimeClient } from '../client'
import type { ServiceContext } from '../types'

// 必須パラメータと省略可能パラメータを明確に分離
type RequiredAgentParams = {
  agentId: string
  agentAliasId: string
  inputText: string
}

type OptionalAgentParams = Partial<{
  sessionId: string
  enableTrace: boolean
}>

type Completion = {
  message: string
  files: { name: string; content: Uint8Array }[]
  traces: TracePart[]
}

export type InvokeAgentResult = {
  $metadata: InvokeAgentCommandOutput['$metadata']
  contentType: InvokeAgentCommandOutput['contentType']
  sessionId: InvokeAgentCommandOutput['sessionId']
  completion?: Completion
}

// InvokeAgentCommandInput から特定のプロパティを除外し、新しい必須・オプションパラメータを組み合わせる
export type InvokeAgentInput = RequiredAgentParams &
  OptionalAgentParams &
  Omit<
    InvokeAgentCommandInput,
    keyof RequiredAgentParams | keyof OptionalAgentParams | 'agentId' | 'agentAliasId' | 'sessionId'
  >

export class AgentService {
  constructor(private context: ServiceContext) {}

  async retrieveAndGenerate(props: RetrieveAndGenerateCommandInput) {
    const agentClient = createAgentRuntimeClient(this.context.store.get('aws'))
    const command = new RetrieveAndGenerateCommand(props)
    const res = await agentClient.send(command)
    return res
  }

  async retrieve(props: RetrieveCommandInput) {
    const agentClient = createAgentRuntimeClient(this.context.store.get('aws'))
    const command = new RetrieveCommand(props)
    const res = await agentClient.send(command)
    return res
  }

  async agenticRetrieveStream(props: any) {
    const agentClient = createAgentRuntimeClient(this.context.store.get('aws'))
    const command = new AgenticRetrieveStreamCommand(props)
    const res = await agentClient.send(command)
    return res
  }

  /**
   * Agent と対話するためのメソッド
   * @param params Agent との対話に必要なパラメータ
   * @returns Agent からのレスポンス
   */
  async invokeAgent(params: InvokeAgentInput): Promise<InvokeAgentResult> {
    const agentClient = createAgentRuntimeClient(this.context.store.get('aws'))
    const { agentId, agentAliasId, sessionId, inputText, enableTrace = false, ...rest } = params

    // セッションIDが指定されていない場合は新規生成
    const generatedSessionId = sessionId || this.generateSessionId()

    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId: generatedSessionId,
      inputText,
      enableTrace,
      ...rest
    })

    try {
      const response = await agentClient.send(command)
      console.log({ response })
      return {
        $metadata: response.$metadata,
        contentType: response.contentType,
        sessionId: response.sessionId,
        completion: response.completion
          ? await this.readStreamResponse(response.completion)
          : undefined
      }
    } catch (error) {
      console.error('Error invoking agent:', error)
      throw error
    }
  }

  // ストリームからレスポンスを読み取るユーティリティ関数
  private async readStreamResponse(stream: AsyncIterable<ResponseStream>) {
    const response: Completion = {
      message: '',
      files: [],
      traces: []
    }

    try {
      const existingFiles = new Set<string>()

      for await (const streamChunk of stream) {
        if (streamChunk.trace?.trace) {
          response.traces.push(streamChunk.trace)
        }

        if (streamChunk.chunk?.bytes) {
          const text = new TextDecoder().decode(streamChunk.chunk.bytes)
          response.message += text
        }

        if (streamChunk.files) {
          for (const file of streamChunk.files.files || []) {
            // 同じファイルが何度か出現することがあるため初出のみ表示
            if (existingFiles.has(file.name || '')) {
              continue
            }
            existingFiles.add(file.name || '')

            if (file.name && file.bytes) {
              response.files.push({
                name: file.name,
                content: file.bytes
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading stream:', error)
      throw error
    }
    return response
  }

  /**
   * セッションIDを生成するためのプライベートメソッド
   * @returns 生成されたセッションID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
