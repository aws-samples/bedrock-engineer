import { z } from 'zod'
import { CustomAgent } from '../../types/agent-chat'
import { CustomAgentSchema } from '../../types/agent-chat.schema'
import { createCategoryLogger } from '../logger'

const validationLogger = createCategoryLogger('validation:agent')

export interface ValidationResult<T> {
  success: boolean
  data: T
  errors?: z.ZodError
}

/**
 * Validate a CustomAgent object using Zod schema
 * In warning-only mode: logs errors but always returns the original data
 *
 * @param agent - The agent object to validate
 * @param context - Context information for logging (e.g., file path, source)
 * @returns Validation result with original data
 */
export function validateCustomAgent(
  agent: unknown,
  context?: { source?: string; filePath?: string }
): ValidationResult<CustomAgent> {
  const result = CustomAgentSchema.safeParse(agent)

  if (!result.success) {
    // Log validation errors with context
    const contextInfo = context
      ? `[${context.source || 'unknown'}${context.filePath ? `: ${context.filePath}` : ''}]`
      : ''

    validationLogger.warn(`CustomAgent validation failed ${contextInfo}`, {
      agentId: (agent as any)?.id,
      agentName: (agent as any)?.name,
      errors: formatZodErrors(result.error)
    })

    // Return original data with error information
    return {
      success: false,
      data: agent as CustomAgent,
      errors: result.error
    }
  }

  // Validation succeeded
  validationLogger.debug('CustomAgent validation succeeded', {
    agentId: result.data.id,
    agentName: result.data.name,
    source: context?.source
  })

  return {
    success: true,
    data: result.data as CustomAgent
  }
}

/**
 * Validate multiple agents at once
 *
 * @param agents - Array of agent objects to validate
 * @param context - Context information for logging
 * @returns Array of validation results
 */
export function validateCustomAgents(
  agents: unknown[],
  context?: { source?: string }
): ValidationResult<CustomAgent>[] {
  return agents.map((agent, index) =>
    validateCustomAgent(agent, {
      ...context,
      filePath: `[index: ${index}]`
    })
  )
}

/**
 * Format Zod errors into a more readable structure
 */
function formatZodErrors(error: z.ZodError): Array<{ path: string; message: string }> {
  return error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message
  }))
}

/**
 * Get validation summary statistics
 */
export function getValidationSummary(results: ValidationResult<CustomAgent>[]): {
  total: number
  valid: number
  invalid: number
  errorCount: number
} {
  const valid = results.filter((r) => r.success).length
  const invalid = results.filter((r) => !r.success).length
  const errorCount = results.reduce((sum, r) => sum + (r.errors?.errors.length || 0), 0)

  return {
    total: results.length,
    valid,
    invalid,
    errorCount
  }
}
