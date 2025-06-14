import { AspectRatio, ImageGeneratorModel } from '../main/api/bedrock'

// 組み込みツール名の明確な定義
export type BuiltInToolName =
  | 'createFolder'
  | 'readFiles'
  | 'writeToFile'
  | 'listFiles'
  | 'moveFile'
  | 'copyFile'
  | 'tavilySearch'
  | 'fetchWebsite'
  | 'generateImage'
  | 'generateVideo'
  | 'checkVideoStatus'
  | 'downloadVideo'
  | 'retrieve'
  | 'invokeBedrockAgent'
  | 'executeCommand'
  | 'applyDiffEdit'
  | 'think'
  | 'recognizeImage'
  | 'invokeFlow'
  | 'codeInterpreter'
  | 'mcp_adapter'
  | 'screenCapture'
  | 'cameraCapture'

// MCPツール名の型安全な定義
export type McpToolName = `mcp_${string}`

// 統合されたToolName型
export type ToolName = BuiltInToolName | McpToolName

// 組み込みツールの定数配列（型ガード用）
const BUILT_IN_TOOLS: readonly BuiltInToolName[] = [
  'createFolder',
  'readFiles',
  'writeToFile',
  'listFiles',
  'moveFile',
  'copyFile',
  'tavilySearch',
  'fetchWebsite',
  'generateImage',
  'generateVideo',
  'checkVideoStatus',
  'downloadVideo',
  'retrieve',
  'invokeBedrockAgent',
  'executeCommand',
  'applyDiffEdit',
  'think',
  'recognizeImage',
  'invokeFlow',
  'codeInterpreter',
  'mcp_adapter',
  'screenCapture',
  'cameraCapture'
] as const

// 組み込みツール名であるかを判定する型ガード
export const isBuiltInTool = (name: string): name is BuiltInToolName => {
  return BUILT_IN_TOOLS.includes(name as BuiltInToolName)
}

// MCPツール名であるかを判定する型ガード
export const isMcpTool = (name: string): name is McpToolName => {
  return name.startsWith('mcp_')
}

// MCPツール名を標準化する関数（通常のツール名をMCP識別子付きにする）
export const normalizeMcpToolName = (name: string): McpToolName => {
  if (isMcpTool(name)) {
    return name
  }
  return `mcp_${name}` as McpToolName
}

// MCP識別子を除いた素のツール名を取得する関数
export const getOriginalMcpToolName = (name: string): string => {
  if (isMcpTool(name)) {
    return name.substring(4) // 'mcp_'の長さ(4)以降の文字列を返す
  }
  return name
}

// ToolName全体の型ガード
export const isValidToolName = (name: string): name is ToolName => {
  return isBuiltInTool(name) || isMcpTool(name)
}

export interface ToolResult<T = any> {
  name: ToolName
  success: boolean
  message?: string
  error?: string
  result: T
}

// Line range interface for tools
export interface LineRange {
  from?: number
  to?: number
}

// ツールごとの入力型定義
export type CreateFolderInput = {
  type: 'createFolder'
  path: string
}

export type ReadFilesInput = {
  type: 'readFiles'
  paths: string[] // 複数のファイルパスを受け取るように変更
  options?: {
    encoding?: BufferEncoding
    lines?: LineRange
  }
}

export type WriteToFileInput = {
  type: 'writeToFile'
  path: string
  content: string
}

export type ListFilesInput = {
  type: 'listFiles'
  path: string
  options?: {
    maxDepth?: number
    ignoreFiles?: string[]
    lines?: LineRange
    recursive?: boolean
  }
}

export type MoveFileInput = {
  type: 'moveFile'
  source: string
  destination: string
}

export type CopyFileInput = {
  type: 'copyFile'
  source: string
  destination: string
}

export type TavilySearchInput = {
  type: 'tavilySearch'
  query: string
  option: {
    include_raw_content: boolean
  }
}

export type FetchWebsiteInput = {
  type: 'fetchWebsite'
  url: string
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
    headers?: Record<string, string>
    body?: string
    cleaning?: boolean
    lines?: LineRange
  }
}

export type GenerateImageInput = {
  type: 'generateImage'
  prompt: string
  outputPath: string
  modelId: ImageGeneratorModel
  negativePrompt?: string
  aspect_ratio?: AspectRatio
  seed?: number
  output_format?: 'png' | 'jpeg' | 'webp'
}

export type StartMovieGenerationInput = {
  type: 'generateVideo'
  prompt: string
  durationSeconds: number
  outputPath?: string
  seed?: number
}

export type CheckVideoStatusInput = {
  type: 'checkVideoStatus'
  invocationArn: string
}

export type DownloadVideoInput = {
  type: 'downloadVideo'
  invocationArn: string
  localPath?: string
}

export type RetrieveInput = {
  type: 'retrieve'
  knowledgeBaseId: string
  query: string
}

export type InvokeBedrockAgentInput = {
  type: 'invokeBedrockAgent'
  agentId: string
  agentAliasId: string
  inputText: string
  sessionId?: string
  file?: {
    filePath: string
    useCase: 'CODE_INTERPRETER' | 'CHAT'
  }
}

export type ExecuteCommandInput = {
  type: 'executeCommand'
} & (
  | {
      command: string
      cwd: string
      pid?: never
      stdin?: never
    }
  | {
      command?: never
      cwd?: never
      pid: number
      stdin: string
    }
)

// 新しい applyDiffEdit ツールの入力型
export type ApplyDiffEditInput = {
  type: 'applyDiffEdit'
  path: string
  originalText: string
  updatedText: string
}

// think ツールの入力型
export type ThinkInput = {
  type: 'think'
  thought: string
}

// recognizeImage ツールの入力型
export type RecognizeImageInput = {
  type: 'recognizeImage'
  imagePaths: string[] // 複数画像をサポート（最大5枚）
  prompt?: string
}

// screenCapture ツールの入力型
export type ScreenCaptureInput = {
  type: 'screenCapture'
  recognizePrompt?: string // 画像認識用のプロンプト（空の場合はキャプチャのみ）
  windowTarget?: string // ウィンドウ名またはアプリケーション名による指定（部分一致）
}

// cameraCapture ツールの入力型
export type CameraCaptureInput = {
  type: 'cameraCapture'
  deviceId?: string // 使用するカメラデバイスID（指定がない場合はデフォルトカメラ）
  recognizePrompt?: string // AI画像認識用のプロンプト（空の場合は撮影のみ）
  quality?: 'low' | 'medium' | 'high' // 画像品質 (low: 640x480, medium: 1280x720, high: 1920x1080)
  format?: 'jpg' | 'png' // 出力形式（デフォルト: jpg）
}

// カメラデバイス情報の型定義
export interface CameraInfo {
  id: string // カメラデバイスID
  name: string // カメラ名（例：FaceTime HDカメラ）
  enabled: boolean // 選択状態
  thumbnail?: string // プレビュー画像（base64エンコード）
  capabilities: {
    maxWidth: number // 最大解像度（幅）
    maxHeight: number // 最大解像度（高さ）
    supportedFormats: string[] // サポートされている形式
  }
}

// エージェント固有のカメラ設定
export interface CameraConfig {
  id: string // カメラデバイスID
  name: string // カメラ名
  enabled: boolean // 許可状態
}

// codeInterpreter ツールの入力型（操作別にディスクリミネーテッドユニオン化）
export type CodeInterpreterInput =
  | CodeInterpreterExecuteInput
  | CodeInterpreterStatusInput
  | CodeInterpreterCancelInput
  | CodeInterpreterListInput

// コード実行操作
export type CodeInterpreterExecuteInput = {
  type: 'codeInterpreter'
  operation?: 'execute'
  code: string // Python コードのみ - 最大限シンプル！
  inputFiles?: Array<{ path: string }> // Optional: files to mount in container
  environment?: 'basic' | 'datascience' // Python environment selection
  async?: boolean // 非同期実行モード（デフォルト: false）
}

// タスクステータス確認操作
export type CodeInterpreterStatusInput = {
  type: 'codeInterpreter'
  operation: 'status'
  taskId: string // 状態確認用のタスクID
}

// タスクキャンセル操作
export type CodeInterpreterCancelInput = {
  type: 'codeInterpreter'
  operation: 'cancel'
  taskId: string // キャンセル用のタスクID
}

// タスク一覧表示操作
export type CodeInterpreterListInput = {
  type: 'codeInterpreter'
  operation: 'list'
  statusFilter?: string // タスクステータスフィルター（optional）
}

// invokeFlow ツールの入力型
export type InvokeFlowInput = {
  type: 'invokeFlow'
  flowIdentifier: string
  flowAliasIdentifier: string
  input: {
    content: {
      document: any // string | number | boolean | object | any[] から any に変更
    }
    nodeName: string
    nodeOutputName: string
  }
}

// MCPツールの入力型
export type McpToolInput = {
  type: string // MCPツール名
  [key: string]: any // MCPツールの任意のパラメータ
}

// ディスクリミネーテッドユニオン型
export type ToolInput =
  | CreateFolderInput
  | ReadFilesInput
  | WriteToFileInput
  | ListFilesInput
  | MoveFileInput
  | CopyFileInput
  | TavilySearchInput
  | FetchWebsiteInput
  | GenerateImageInput
  | StartMovieGenerationInput
  | CheckVideoStatusInput
  | DownloadVideoInput
  | RecognizeImageInput
  | RetrieveInput
  | InvokeBedrockAgentInput
  | ExecuteCommandInput
  | ApplyDiffEditInput
  | ThinkInput
  | ScreenCaptureInput
  | CameraCaptureInput
  | InvokeFlowInput
  | CodeInterpreterInput
  | McpToolInput // MCPツール入力を追加

// ツール名から入力型を取得するユーティリティ型
export type ToolInputTypeMap = {
  createFolder: CreateFolderInput
  readFiles: ReadFilesInput
  writeToFile: WriteToFileInput
  listFiles: ListFilesInput
  moveFile: MoveFileInput
  copyFile: CopyFileInput
  tavilySearch: TavilySearchInput
  fetchWebsite: FetchWebsiteInput
  generateImage: GenerateImageInput
  generateVideo: StartMovieGenerationInput
  checkVideoStatus: CheckVideoStatusInput
  downloadVideo: DownloadVideoInput
  recognizeImage: RecognizeImageInput
  retrieve: RetrieveInput
  invokeBedrockAgent: InvokeBedrockAgentInput
  executeCommand: ExecuteCommandInput
  applyDiffEdit: ApplyDiffEditInput
  think: ThinkInput
  screenCapture: ScreenCaptureInput
  cameraCapture: CameraCaptureInput
  invokeFlow: InvokeFlowInput
  codeInterpreter: CodeInterpreterInput
  [key: string]: any // MCPツールに対応するためのインデックスシグネチャ
}
