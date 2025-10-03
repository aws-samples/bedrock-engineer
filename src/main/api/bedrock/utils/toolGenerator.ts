import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { JSONSchema } from '../types/structured-output'

/**
 * Utility class to generate Bedrock Tool definitions from JSON schemas
 */
export class ToolGenerator {
  /**
   * Generate a Bedrock Tool definition from a JSON schema
   * @param schema - The JSON schema defining the expected output structure
   * @param options - Optional tool metadata
   * @returns A Bedrock Tool definition
   */
  static generateFromSchema(
    schema: JSONSchema,
    options?: {
      name?: string
      description?: string
    }
  ): Tool {
    return {
      toolSpec: {
        name: options?.name || 'structured_output',
        description:
          options?.description || 'Return structured data according to the specified schema',
        inputSchema: {
          json: schema
        }
      }
    }
  }

  /**
   * Wrap a schema in an object with a single property
   * Useful for adding a top-level wrapper around the schema
   * @param schema - The schema to wrap
   * @param wrapperKey - The key to use for wrapping (default: 'output')
   * @returns A wrapped schema
   */
  static wrapSchema(schema: JSONSchema, wrapperKey = 'output'): JSONSchema {
    return {
      type: 'object',
      properties: {
        [wrapperKey]: schema
      },
      required: [wrapperKey]
    }
  }
}
