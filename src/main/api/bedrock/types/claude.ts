import { ConverseCommandOutput } from '@aws-sdk/client-bedrock-runtime'

// Claude モデルの Content Block 型定義
export interface ClaudeContentBlock {
  type: 'text' | 'image'
  text?: string
  source?: {
    type: 'base64'
    media_type: string
    data: string
  }
}

// Claude モデルの Message 型定義
export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: ClaudeContentBlock[]
}

// Claude モデルの応答型定義
export interface ClaudeConverseResponse extends ConverseCommandOutput {
  content: ClaudeContentBlock[]
}

// Claude モデルの画像認識リクエスト型定義
export interface ClaudeImageRecognitionRequest {
  modelId: string
  messages: ClaudeMessage[]
  max_tokens: number
}
