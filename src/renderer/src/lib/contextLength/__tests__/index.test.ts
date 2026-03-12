import { limitContextLength } from '../'
import type { Message } from '@aws-sdk/client-bedrock-runtime'
import { describe, test, expect } from '@jest/globals'

/* eslint-disable @typescript-eslint/no-unused-vars */
describe('limitContextLength', () => {
  describe('Claude 3.5', () => {
    test('ToolUse, ToolResult のペアがキリよく取り出せる場合、10個の messages から送信対象の 5個を取り出すと messages の新しい方から順番に 5 つ取り出し、ToolUse, ToolResult のペアも残す', () => {
      const messages = [
        {
          role: 'user',
          content: [
            {
              text: 'このソフトウェアを説明して'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'このソフトウェア「Bedrock Engineer」について説明します。まず、プロジェクトの構造を確認させてください。'
            },
            {
              toolUse: {
                name: 'listFiles',
                toolUseId: 'tooluse_5-fdhvgoR3mhZ2CzBnXDrA',
                input: {
                  path: '/Users/geeawa/work/bedrock-engineer'
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_5-fdhvgoR3mhZ2CzBnXDrA',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'xxx'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              text: 'c) Webサイトジェネレーターについて詳しく'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'WebサイトジェネレーターについてコードとUIを詳しく分析し、説明していきます。'
            },
            {
              toolUse: {
                name: 'readFiles',
                toolUseId: 'tooluse_DhzNRlPAQw-1-d41Sig47A',
                input: {
                  paths: [
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/pages/WebsiteGeneratorPage/WebsiteGeneratorPage.tsx',
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/contexts/WebsiteGeneratorContext.tsx'
                  ]
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_DhzNRlPAQw-1-d41Sig47A',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                name: 'readFiles',
                toolUseId: 'tooluse_UcPy6yU-Sg-12rkmWq_9_w',
                input: {
                  paths: [
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/pages/WebsiteGeneratorPage/templates.tsx'
                  ]
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_UcPy6yU-Sg-12rkmWq_9_w',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'xxx'
            }
          ]
        }
      ] as Message[]

      const result = limitContextLength(messages, 5)

      const expected = [
        {
          role: 'assistant',
          content: [
            {
              text: 'WebサイトジェネレーターについてコードとUIを詳しく分析し、説明していきます。'
            },
            {
              toolUse: {
                name: 'readFiles',
                toolUseId: 'tooluse_DhzNRlPAQw-1-d41Sig47A',
                input: {
                  paths: [
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/pages/WebsiteGeneratorPage/WebsiteGeneratorPage.tsx',
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/contexts/WebsiteGeneratorContext.tsx'
                  ]
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_DhzNRlPAQw-1-d41Sig47A',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                name: 'readFiles',
                toolUseId: 'tooluse_UcPy6yU-Sg-12rkmWq_9_w',
                input: {
                  paths: [
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/pages/WebsiteGeneratorPage/templates.tsx'
                  ]
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_UcPy6yU-Sg-12rkmWq_9_w',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'xxx'
            }
          ]
        }
      ]
      expect(result).toMatchObject(expected)
    })

    test('ToolUse, ToolResult のペアがキリよく取り出せない場合、10個の messages から送信対象の 4個を取り出すと messages の新しい方から順番に 4 つ取り出し、ToolUse, ToolResult のペアも残す。ToolUseId の帳尻を合わせた分、結果の配列の長さは 5 になる', () => {
      const messages = [
        {
          role: 'user',
          content: [
            {
              text: 'このソフトウェアを説明して'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'このソフトウェア「Bedrock Engineer」について説明します。まず、プロジェクトの構造を確認させてください。'
            },
            {
              toolUse: {
                name: 'listFiles',
                toolUseId: 'tooluse_5-fdhvgoR3mhZ2CzBnXDrA',
                input: {
                  path: '/Users/geeawa/work/bedrock-engineer'
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_5-fdhvgoR3mhZ2CzBnXDrA',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'xxx'
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              text: 'c) Webサイトジェネレーターについて詳しく'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'WebサイトジェネレーターについてコードとUIを詳しく分析し、説明していきます。'
            },
            {
              toolUse: {
                name: 'readFiles',
                toolUseId: 'tooluse_DhzNRlPAQw-1-d41Sig47A',
                input: {
                  paths: [
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/pages/WebsiteGeneratorPage/WebsiteGeneratorPage.tsx',
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/contexts/WebsiteGeneratorContext.tsx'
                  ]
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_DhzNRlPAQw-1-d41Sig47A',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                name: 'readFiles',
                toolUseId: 'tooluse_UcPy6yU-Sg-12rkmWq_9_w',
                input: {
                  paths: [
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/pages/WebsiteGeneratorPage/templates.tsx'
                  ]
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_UcPy6yU-Sg-12rkmWq_9_w',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'xxx'
            }
          ]
        }
      ] as Message[]

      const result = limitContextLength(messages, 4)
      expect(result.length).toBe(5) // ToolUseId の帳尻を合わせた分、4にならない

      const expected = [
        {
          role: 'assistant',
          content: [
            {
              text: 'WebサイトジェネレーターについてコードとUIを詳しく分析し、説明していきます。'
            },
            {
              toolUse: {
                name: 'readFiles',
                toolUseId: 'tooluse_DhzNRlPAQw-1-d41Sig47A',
                input: {
                  paths: [
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/pages/WebsiteGeneratorPage/WebsiteGeneratorPage.tsx',
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/contexts/WebsiteGeneratorContext.tsx'
                  ]
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_DhzNRlPAQw-1-d41Sig47A',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                name: 'readFiles',
                toolUseId: 'tooluse_UcPy6yU-Sg-12rkmWq_9_w',
                input: {
                  paths: [
                    '/Users/geeawa/work/bedrock-engineer/src/renderer/src/pages/WebsiteGeneratorPage/templates.tsx'
                  ]
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_UcPy6yU-Sg-12rkmWq_9_w',
                content: [
                  {
                    text: 'xxx'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: 'xxx'
            }
          ]
        }
      ]
      expect(result).toMatchObject(expected)
    })
  })
  describe('Claude 3.7 extended thinking（reasoningContentがある場合）', () => {
    test('ToolUse, ToolResult のペアがキリよく取り出せる場合、6個の messages から送信対象の 5個の要素を抽出すると、reasoningContent は残しつつ ToolUse, ToolResult のペアも残す。一番初めの要素が削除される。', () => {
      const messages = [
        {
          role: 'user',
          content: [
            {
              text: 'このソフトウェアを説明して'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              reasoningContent: {
                reasoningText: {
                  text: 'ユーザーは「このソフトウェアを説明して」と日本語で質問しています。これは「このソフトウェア（このプロジェクト）について説明してください」という依頼です。\n\nまず、現在の作業ディレクトリ内のファイル構造を確認して、どのようなソフトウェアプロジェクトなのかを把握する必要があります。\n\nまずはルートディレクトリのファイル構造を確認します。',
                  signature: 'test-signature'
                }
              }
            },
            {
              text: 'まず、このソフトウェアの全体像を把握するために、プロジェクトの構造を確認してみましょう。'
            },
            {
              toolUse: {
                name: 'listFiles',
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                input: {
                  path: '/Users/geeawa/work/bedrock-engineer',
                  options: {
                    maxDepth: 1
                  }
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                content: [
                  {
                    text: 'Directory Structure:\n\n├── 📁 .bedrock-engineer\n│   └── ...\n├── 📄 .editorconfig\n├── ...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: '\n\n次に、パッケージ情報を確認して、このソフトウェアがどのようなものであるかをより詳しく調べましょう。'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                name: 'readFiles',
                input: {
                  paths: ['/Users/geeawa/work/bedrock-engineer/package.json']
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                content: [
                  {
                    text: 'File: /Users/geeawa/work/bedrock-engineer/package.json\n...\n{\n  "name": "bedrock-engineer",\n  "version": "1.4.1",\n  "description": "Autonomous software development agent apps using Amazon Bedrock...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        }
      ] as Message[]

      const result = limitContextLength(messages, 5)
      expect(result.length).toBe(5)

      const expected = [
        {
          role: 'assistant',
          content: [
            {
              reasoningContent: {
                reasoningText: {
                  text: 'ユーザーは「このソフトウェアを説明して」と日本語で質問しています。これは「このソフトウェア（このプロジェクト）について説明してください」という依頼です。\n\nまず、現在の作業ディレクトリ内のファイル構造を確認して、どのようなソフトウェアプロジェクトなのかを把握する必要があります。\n\nまずはルートディレクトリのファイル構造を確認します。',
                  signature: 'test-signature'
                }
              }
            },
            {
              text: 'まず、このソフトウェアの全体像を把握するために、プロジェクトの構造を確認してみましょう。'
            },
            {
              toolUse: {
                name: 'listFiles',
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                input: {
                  path: '/Users/geeawa/work/bedrock-engineer',
                  options: {
                    maxDepth: 1
                  }
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                content: [
                  {
                    text: 'Directory Structure:\n\n├── 📁 .bedrock-engineer\n│   └── ...\n├── 📄 .editorconfig\n├── ...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: '\n\n次に、パッケージ情報を確認して、このソフトウェアがどのようなものであるかをより詳しく調べましょう。'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                name: 'readFiles',
                input: {
                  paths: ['/Users/geeawa/work/bedrock-engineer/package.json']
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                content: [
                  {
                    text: 'File: /Users/geeawa/work/bedrock-engineer/package.json\n...\n{\n  "name": "bedrock-engineer",\n  "version": "1.4.1",\n  "description": "Autonomous software development agent apps using Amazon Bedrock...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        }
      ]

      expect(result).toMatchObject(expected)
    })

    test('ToolUse, ToolResult のペアがキリよく取り出せない場合、6個の messages から送信対象の 4個の要素を抽出すると、reasoningContent は残しつつ ToolUse, ToolResult のペアも残す。一番初めの要素が削除される。reasoningContentのBlock の ToolResult の ToolUseId は抽出対象となるため、reasoningContentのBlock の ToolUse も抽出対象として含まれる。', () => {
      const messages = [
        {
          role: 'user',
          content: [
            {
              text: 'このソフトウェアを説明して'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              reasoningContent: {
                reasoningText: {
                  text: 'ユーザーは「このソフトウェアを説明して」と日本語で質問しています。これは「このソフトウェア（このプロジェクト）について説明してください」という依頼です。\n\nまず、現在の作業ディレクトリ内のファイル構造を確認して、どのようなソフトウェアプロジェクトなのかを把握する必要があります。\n\nまずはルートディレクトリのファイル構造を確認します。',
                  signature: 'test-signature'
                }
              }
            },
            {
              text: 'まず、このソフトウェアの全体像を把握するために、プロジェクトの構造を確認してみましょう。'
            },
            {
              toolUse: {
                name: 'listFiles',
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                input: {
                  path: '/Users/geeawa/work/bedrock-engineer',
                  options: {
                    maxDepth: 1
                  }
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                content: [
                  {
                    text: 'Directory Structure:\n\n├── 📁 .bedrock-engineer\n│   └── ...\n├── 📄 .editorconfig\n├── ...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: '\n\n次に、パッケージ情報を確認して、このソフトウェアがどのようなものであるかをより詳しく調べましょう。'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                name: 'readFiles',
                input: {
                  paths: ['/Users/geeawa/work/bedrock-engineer/package.json']
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                content: [
                  {
                    text: 'File: /Users/geeawa/work/bedrock-engineer/package.json\n...\n{\n  "name": "bedrock-engineer",\n  "version": "1.4.1",\n  "description": "Autonomous software development agent apps using Amazon Bedrock...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        }
      ] as Message[]

      const result = limitContextLength(messages, 4)
      expect(result.length).toBe(5)

      const expected = [
        {
          role: 'assistant',
          content: [
            {
              reasoningContent: {
                reasoningText: {
                  text: 'ユーザーは「このソフトウェアを説明して」と日本語で質問しています。これは「このソフトウェア（このプロジェクト）について説明してください」という依頼です。\n\nまず、現在の作業ディレクトリ内のファイル構造を確認して、どのようなソフトウェアプロジェクトなのかを把握する必要があります。\n\nまずはルートディレクトリのファイル構造を確認します。',
                  signature: 'test-signature'
                }
              }
            },
            {
              text: 'まず、このソフトウェアの全体像を把握するために、プロジェクトの構造を確認してみましょう。'
            },
            {
              toolUse: {
                name: 'listFiles',
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                input: {
                  path: '/Users/geeawa/work/bedrock-engineer',
                  options: {
                    maxDepth: 1
                  }
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                content: [
                  {
                    text: 'Directory Structure:\n\n├── 📁 .bedrock-engineer\n│   └── ...\n├── 📄 .editorconfig\n├── ...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: '\n\n次に、パッケージ情報を確認して、このソフトウェアがどのようなものであるかをより詳しく調べましょう。'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                name: 'readFiles',
                input: {
                  paths: ['/Users/geeawa/work/bedrock-engineer/package.json']
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                content: [
                  {
                    text: 'File: /Users/geeawa/work/bedrock-engineer/package.json\n...\n{\n  "name": "bedrock-engineer",\n  "version": "1.4.1",\n  "description": "Autonomous software development agent apps using Amazon Bedrock...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        }
      ]

      expect(result).toMatchObject(expected)
    })

    test('ToolUse, ToolResult のペアがキリよく取り出せない場合、6個の messages から送信対象の 3個の要素を抽出すると、reasoningContent は残しつつ ToolUse, ToolResult のペアも残す。reasoningContent の Block とそれに対応する ToolUseId のブロックは必ず抽出対象に含める。', () => {
      const messages = [
        {
          role: 'user',
          content: [
            {
              text: 'このソフトウェアを説明して'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              reasoningContent: {
                reasoningText: {
                  text: 'ユーザーは「このソフトウェアを説明して」と日本語で質問しています。これは「このソフトウェア（このプロジェクト）について説明してください」という依頼です。\n\nまず、現在の作業ディレクトリ内のファイル構造を確認して、どのようなソフトウェアプロジェクトなのかを把握する必要があります。\n\nまずはルートディレクトリのファイル構造を確認します。',
                  signature: 'test-signature'
                }
              }
            },
            {
              text: 'まず、このソフトウェアの全体像を把握するために、プロジェクトの構造を確認してみましょう。'
            },
            {
              toolUse: {
                name: 'listFiles',
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                input: {
                  path: '/Users/geeawa/work/bedrock-engineer',
                  options: {
                    maxDepth: 1
                  }
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                content: [
                  {
                    text: 'Directory Structure:\n\n├── 📁 .bedrock-engineer\n│   └── ...\n├── 📄 .editorconfig\n├── ...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: '\n\n次に、パッケージ情報を確認して、このソフトウェアがどのようなものであるかをより詳しく調べましょう。'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                name: 'readFiles',
                input: {
                  paths: ['/Users/geeawa/work/bedrock-engineer/package.json']
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                content: [
                  {
                    text: 'File: /Users/geeawa/work/bedrock-engineer/package.json\n...\n{\n  "name": "bedrock-engineer",\n  "version": "1.4.1",\n  "description": "Autonomous software development agent apps using Amazon Bedrock...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        }
      ] as Message[]

      const result = limitContextLength(messages, 3)

      const expected = [
        {
          role: 'assistant',
          content: [
            {
              reasoningContent: {
                reasoningText: {
                  text: 'ユーザーは「このソフトウェアを説明して」と日本語で質問しています。これは「このソフトウェア（このプロジェクト）について説明してください」という依頼です。\n\nまず、現在の作業ディレクトリ内のファイル構造を確認して、どのようなソフトウェアプロジェクトなのかを把握する必要があります。\n\nまずはルートディレクトリのファイル構造を確認します。',
                  signature: 'test-signature'
                }
              }
            },
            {
              text: 'まず、このソフトウェアの全体像を把握するために、プロジェクトの構造を確認してみましょう。'
            },
            {
              toolUse: {
                name: 'listFiles',
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                input: {
                  path: '/Users/geeawa/work/bedrock-engineer',
                  options: {
                    maxDepth: 1
                  }
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_x-jIzNmaSk-seANwPClZcw',
                content: [
                  {
                    text: 'Directory Structure:\n\n├── 📁 .bedrock-engineer\n│   └── ...\n├── 📄 .editorconfig\n├── ...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              text: '\n\n次に、パッケージ情報を確認して、このソフトウェアがどのようなものであるかをより詳しく調べましょう。'
            }
          ]
        },
        {
          role: 'assistant',
          content: [
            {
              toolUse: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                name: 'readFiles',
                input: {
                  paths: ['/Users/geeawa/work/bedrock-engineer/package.json']
                }
              }
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              toolResult: {
                toolUseId: 'tooluse_0EC4kZ52TYmTk4Cpdht-PA',
                content: [
                  {
                    text: 'File: /Users/geeawa/work/bedrock-engineer/package.json\n...\n{\n  "name": "bedrock-engineer",\n  "version": "1.4.1",\n  "description": "Autonomous software development agent apps using Amazon Bedrock...'
                  }
                ],
                status: 'success'
              }
            }
          ]
        }
      ]

      expect(result).toMatchObject(expected)
    })
  })
})
