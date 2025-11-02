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
        'Update an existing file in the Sandpack project. Use this to modify file contents.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path to update'
            },
            content: {
              type: 'string',
              description: 'New complete file content'
            }
          },
          required: ['path', 'content']
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
        'List all files in the current Sandpack project. Use this to understand the project structure before making changes.',
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
