import type { Tool } from '@aws-sdk/client-bedrock-runtime'

export const SANDPACK_TOOL_SPECS: Tool[] = [
  {
    toolSpec: {
      name: 'sandpackCreateFile',
      description:
        'Create a new file in the Sandpack virtual filesystem. Use this to add new components, utilities, or any other files to the project.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description:
                'File path relative to project root (e.g., /src/components/Button.tsx, /src/utils/helpers.ts)'
            },
            content: {
              type: 'string',
              description: 'Complete file content including all imports and exports'
            }
          },
          required: ['path', 'content']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'sandpackUpdateFile',
      description:
        'Update an existing file in the Sandpack project by replacing specific text. This tool replaces the specified original text with updated text at the exact location. Use this when you need to make precise modifications to existing file content. The tool ensures that only the specified text is replaced, keeping the rest of the file intact. Important: originalText must match the text in the file exactly, including whitespace and line breaks.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to update (e.g., /src/App.tsx)'
            },
            originalText: {
              type: 'string',
              description:
                'The exact original text to be replaced. Must match exactly including whitespace and line breaks. If not found, the operation will fail.'
            },
            updatedText: {
              type: 'string',
              description:
                'The new text that will replace the original text. Can be of different length. Whitespace and line breaks will be preserved exactly as provided.'
            }
          },
          required: ['path', 'originalText', 'updatedText']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'sandpackDeleteFile',
      description: 'Delete a file from the Sandpack project.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to delete'
            }
          },
          required: ['path']
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'sandpackListFiles',
      description:
        'List all files in the current Sandpack project in a hierarchical tree structure. The output shows the directory structure with folders and files organized visually, including file sizes. Use this to understand the project structure before making changes.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {}
        }
      }
    }
  },
  {
    toolSpec: {
      name: 'sandpackReadFile',
      description:
        "Read a file's content from the Sandpack project. Use this to understand existing code before modifying it.",
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to read'
            }
          },
          required: ['path']
        }
      }
    }
  }
]
