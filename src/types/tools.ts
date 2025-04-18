import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { AspectRatio, ImageGeneratorModel } from '../main/api/bedrock'

export type ToolName =
  | 'createFolder'
  | 'readFiles'
  | 'writeToFile'
  | 'listFiles'
  | 'moveFile'
  | 'copyFile'
  | 'tavilySearch'
  | 'fetchWebsite'
  | 'generateImage'
  | 'retrieve'
  | 'invokeBedrockAgent'
  | 'executeCommand'
  | 'applyDiffEdit'
  | 'think'
  | 'recognizeImage'
  | string // MCPツール名を許容するために文字列型も追加

/**
 * MCPツール関連のユーティリティ関数
 *
 * 注意: AWS APIの制約により、ツール名には [a-zA-Z0-9_-]+ の文字のみ許可されています。
 * そのため、MCPツールには "mcp:" ではなく "mcp_" プレフィックスを使用します。
 */
// MCPツール名であるかを判定する関数
export const isMcpTool = (name: string): boolean => {
  return name.startsWith('mcp_')
}

// MCPツール名を標準化する関数（通常のツール名をMCP識別子付きにする）
export const normalizeMcpToolName = (name: string): string => {
  if (isMcpTool(name)) {
    return name
  }
  return `mcp_${name}`
}

// MCP識別子を除いた素のツール名を取得する関数
export const getOriginalMcpToolName = (name: string): string => {
  if (isMcpTool(name)) {
    return name.substring(4) // 'mcp_'の長さ(4)以降の文字列を返す
  }
  return name
}

export interface ToolResult<T = any> {
  name: ToolName
  success: boolean
  message?: string
  error?: string
  result: T
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
    chunkIndex?: number
    chunkSize?: number
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
    ignoreFiles?: string[]
    chunkIndex?: number
    maxDepth?: number
    chunkSize?: number
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
    chunkIndex?: number
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
  | RecognizeImageInput
  | RetrieveInput
  | InvokeBedrockAgentInput
  | ExecuteCommandInput
  | ApplyDiffEditInput
  | ThinkInput
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
  recognizeImage: RecognizeImageInput
  retrieve: RetrieveInput
  invokeBedrockAgent: InvokeBedrockAgentInput
  executeCommand: ExecuteCommandInput
  applyDiffEdit: ApplyDiffEditInput
  think: ThinkInput
  [key: string]: any // MCPツールに対応するためのインデックスシグネチャ
}

/**
 * ツール定義（JSON Schema）
 *
 * Amazon Nova understanding models currently support only a subset of JsonSchema functionality when used to define the ToolInputSchema in Converse API.
 * The top level schema must be of type Object.
 * Only three fields are supported in the top-level Object - type (must be set to 'object'), properties, and required.
 * https://docs.aws.amazon.com/nova/latest/userguide/tool-use-definition.html#:~:text=the%20tool%20configuration.-,Note,-Amazon%20Nova%20understanding
 */
export const tools: Tool[] = [
  {
    toolSpec: {
      name: 'createFolder',
      description:
        'Create a new folder at the specified path. Use this when you need to create a new directory in the project structure.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path where the folder should be created'
            }
          },
          required: ['path']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'writeToFile',
      description:
        'Write content to an existing file at the specified path. Use this when you need to add or update content in an existing file.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path of the file to write to'
            },
            content: {
              type: 'string',
              description: 'The content to write to the file'
            }
          },
          required: ['path', 'content']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'applyDiffEdit',
      description: `Apply a diff edit to a file. This tool replaces the specified original text with updated text at the exact location in the file. Use this when you need to make precise modifications to existing file content. The tool ensures that only the specified text is replaced, keeping the rest of the file intact.

Example:
{
   path: '/path/to/file.ts',
   originalText: 'function oldName() {\n  // old implementation\n}',
   updatedText: 'function newName() {\n  // new implementation\n}'
}
        `,
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description:
                'The absolute path of the file to modify. Make sure to provide the complete path starting from the root directory.'
            },
            originalText: {
              type: 'string',
              description:
                'The exact original text to be replaced. Must match the text in the file exactly, including whitespace and line breaks. If the text is not found, the operation will fail.'
            },
            updatedText: {
              type: 'string',
              description:
                'The new text that will replace the original text. Can be of different length than the original text. Whitespace and line breaks in this text will be preserved exactly as provided.'
            }
          },
          required: ['path', 'originalText', 'updatedText']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'readFiles',
      description:
        'Read the content of multiple files at the specified paths. Content is automatically split into chunks for better management. For Excel files, the content is converted to CSV format.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            paths: {
              type: 'array',
              items: {
                type: 'string'
              },
              description:
                'Array of file paths to read. Supports text files and Excel files (.xlsx, .xls).'
            },
            options: {
              type: 'object',
              description: 'Optional configurations for reading files',
              properties: {
                chunkIndex: {
                  type: 'number',
                  description: 'The index of the specific chunk to retrieve (starting from 1)'
                },
                chunkSize: {
                  type: 'number',
                  description: 'Maximum size of each chunk in characters (default: 4000)'
                }
              }
            }
          },
          required: ['paths']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'listFiles',
      description:
        'List the entire directory structure, including all subdirectories and files, in a hierarchical format. Content is automatically split into chunks for better management. Use maxDepth to limit directory depth and chunkIndex to retrieve specific chunks.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The root path to start listing the directory structure from'
            },
            options: {
              type: 'object',
              description: 'Optional configurations for listing files',
              properties: {
                ignoreFiles: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Array of patterns to ignore when listing files (gitignore format)'
                },
                chunkIndex: {
                  type: 'number',
                  description: 'The index of the specific chunk to retrieve (starting from 1)'
                },
                maxDepth: {
                  type: 'number',
                  description: 'Maximum depth of directory traversal (-1 for unlimited)'
                },
                chunkSize: {
                  type: 'number',
                  description: 'Maximum size of each chunk in characters (default: 4000)'
                }
              }
            }
          },
          required: ['path']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'moveFile',
      description:
        'Move a file from one location to another. Use this when you need to organize files in the project structure.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'The current path of the file'
            },
            destination: {
              type: 'string',
              description: 'The new path for the file'
            }
          },
          required: ['source', 'destination']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'copyFile',
      description:
        'Copy a file from one location to another. Use this when you need to duplicate a file in the project structure.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'The path of the file to copy'
            },
            destination: {
              type: 'string',
              description: 'The new path for the copied file'
            }
          },
          required: ['source', 'destination']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'tavilySearch',
      description:
        'Perform a web search using Tavily API to get up-to-date information or additional context. Use this when you need current information or feel a search could provide a better answer.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query'
            },
            option: {
              type: 'object',
              description: 'Optional configurations for the search',
              properties: {
                include_raw_content: {
                  type: 'boolean',
                  description:
                    'Whether to include raw content in the search results. DEFAULT is false'
                }
              }
            }
          },
          required: ['query']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'fetchWebsite',
      description: `Fetch content from a specified URL. For large content, it will be automatically split into manageable chunks.
If the cleaning option is true, Extracts plain text content from HTML by removing markup and unnecessary elements. Default is false.
First call without a chunkIndex(Must be 1 or greater) to get an overview and total number of chunks. Then, if needed, call again with a specific chunkIndex to retrieve that chunk.`,
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to fetch content from'
            },
            options: {
              type: 'object',
              description: 'Optional request configurations',
              properties: {
                method: {
                  type: 'string',
                  description: 'HTTP method (GET, POST, etc.)',
                  enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
                },
                headers: {
                  type: 'object',
                  description: 'Request headers',
                  additionalProperties: {
                    type: 'string'
                  }
                },
                body: {
                  type: 'string',
                  description: 'Request body (for POST, PUT, etc.)'
                },
                chunkIndex: {
                  type: 'number',
                  description:
                    'Optional. The index of the specific chunk to fetch (starting from 1, Must be 1 or greater). If not provided, returns a summary of all chunks.'
                },
                cleaning: {
                  type: 'boolean',
                  description:
                    'Optional. If true, Extracts plain text content from HTML by removing markup and unnecessary elements. Default is false.'
                }
              }
            }
          },
          required: ['url']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'generateImage',
      description:
        'Generate an image using Amazon Bedrock Foundation Models. By default uses stability.sd3-5-large-v1:0. Images are saved to the specified path. For Titan models, specific aspect ratios and sizes are supported.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Text description of the image you want to generate'
            },
            outputPath: {
              type: 'string',
              description:
                'Path where the generated image should be saved, including filename (e.g., "/path/to/image.png")'
            },
            modelId: {
              type: 'string',
              description:
                'Model to use. Includes Stability.ai models and Amazon models. Note that Amazon models have specific region availability.',
              enum: [
                'stability.sd3-5-large-v1:0',
                'stability.sd3-large-v1:0',
                'stability.stable-image-core-v1:1',
                'stability.stable-image-ultra-v1:1',
                'amazon.nova-canvas-v1:0',
                'amazon.titan-image-generator-v2:0',
                'amazon.titan-image-generator-v1'
              ],
              default: 'stability.sd3-5-large-v1:0'
            },
            negativePrompt: {
              type: 'string',
              description: 'Optional. Things to exclude from the image'
            },
            aspect_ratio: {
              type: 'string',
              description:
                'Optional. Aspect ratio of the generated image. For Titan models, specific sizes will be chosen based on the aspect ratio.',
              enum: [
                '1:1',
                '16:9',
                '2:3',
                '3:2',
                '4:5',
                '5:4',
                '9:16',
                '9:21',
                '5:3',
                '3:5',
                '7:9',
                '9:7',
                '6:11',
                '11:6',
                '5:11',
                '11:5',
                '9:5'
              ]
            },
            seed: {
              type: 'number',
              description:
                'Optional. Seed for deterministic generation. For Titan models, range is 0 to 2147483647.'
            },
            output_format: {
              type: 'string',
              description: 'Optional. Output format of the generated image',
              enum: ['png', 'jpeg', 'webp'],
              default: 'png'
            }
          },
          required: ['prompt', 'outputPath', 'modelId']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'recognizeImage',
      description:
        "Analyze and describe multiple images (up to 5) using Amazon Bedrock's Claude vision capabilities. The tool processes images in parallel and returns detailed descriptions.",
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            imagePaths: {
              type: 'array',
              items: {
                type: 'string'
              },
              description:
                'Paths to the image files to analyze (maximum 5). Supports common formats: .jpg, .jpeg, .png, .gif, .webp'
            },
            prompt: {
              type: 'string',
              description:
                'Custom prompt to guide the image analysis (e.g., "Describe this image in detail", "What text appears in this image?", etc.). Default: "Describe this image in detail."'
            }
          },
          required: ['imagePaths']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'retrieve',
      description:
        'Retrieve information from a knowledge base using Amazon Bedrock Knowledge Base. Use this when you need to get information from a knowledge base.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            knowledgeBaseId: {
              type: 'string',
              description: 'The ID of the knowledge base to retrieve from'
            },
            query: {
              type: 'string',
              description: 'The query to search for in the knowledge base'
            }
          },
          required: ['knowledgeBaseId', 'query']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'invokeBedrockAgent',
      description:
        'Invoke an Amazon Bedrock Agent using the specified agent ID and alias ID. Use this when you need to interact with an agent.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'The ID of the agent to invoke'
            },
            agentAliasId: {
              type: 'string',
              description: 'The alias ID of the agent to invoke'
            },
            sessionId: {
              type: 'string',
              description:
                'Optional. The session ID to use for the agent invocation. The session ID is issued when you execute invokeBedrockAgent for the first time and is included in the response. Specify it if you want to continue the conversation from the second time onwards.'
            },
            inputText: {
              type: 'string',
              description: 'The input text to send to the agent'
            },
            file: {
              type: 'object',
              description:
                'Optional. The file to send to the agent. Be sure to specify if you need to analyze files.',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'The path of the file to send to the agent'
                },
                useCase: {
                  type: 'string',
                  description:
                    'The use case of the file. Specify "CODE_INTERPRETER" if Python code analysis is required. Otherwise, specify "CHAT".',
                  enum: ['CODE_INTERPRETER', 'CHAT']
                }
              }
            }
          },
          required: ['agentId', 'agentAliasId', 'inputText']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'executeCommand',
      description:
        'Execute a command or send input to a running process. First execute the command to get a PID, then use that PID to send input if needed. Usage: 1) First call with command and cwd to start process, 2) If input is required, call again with pid and stdin.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The command to execute (used when starting a new process)'
            },
            cwd: {
              type: 'string',
              description: 'The working directory for the command execution (used with command)'
            },
            pid: {
              type: 'number',
              description:
                'Process ID to send input to (used when sending input to existing process)'
            },
            stdin: {
              type: 'string',
              description: 'Standard input to send to the process (used with pid)'
            }
          }
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'think',
      description:
        'Use the tool to think about something. It will not obtain new information or make any changes to the repository, but just log the thought. Use it when complex reasoning or brainstorming is needed. For example, if you explore the repo and discover the source of a bug, call this tool to brainstorm several unique ways of fixing the bug, and assess which change(s) are likely to be simplest and most effective. Alternatively, if you receive some test results, call this tool to brainstorm ways to fix the failing tests.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            thought: {
              type: 'string',
              description: 'Your thoughts.'
            }
          },
          required: ['thought']
        }
      }
    }
  }
]
