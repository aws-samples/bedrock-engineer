import { CustomAgentSchema } from '../schemas/agent-schema'
import { CustomAgent } from '../../types/agent-chat'

/**
 * Validation result for CustomAgent
 */
export interface ValidationResult {
  success: boolean
  agent?: CustomAgent
  errors?: string[]
}

/**
 * Validate a CustomAgent object using Zod schema
 * @param data - Unknown data to validate
 * @returns Validation result with success status, validated agent, or error messages
 */
export function validateAgent(data: unknown): ValidationResult {
  const result = CustomAgentSchema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      agent: result.data
    }
  }

  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
  }
}

/**
 * Validate multiple CustomAgent objects
 * @param dataArray - Array of unknown data to validate
 * @returns Array of validation results
 */
export function validateAgents(dataArray: unknown[]): ValidationResult[] {
  return dataArray.map((data) => validateAgent(data))
}
