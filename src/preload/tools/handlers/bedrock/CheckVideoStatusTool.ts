/**
 * CheckVideoStatus tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { ipc } from '../../../ipc-client'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for CheckVideoStatusTool
 */
interface CheckVideoStatusInput {
  type: 'checkVideoStatus'
  invocationArn: string
}

/**
 * Result type for CheckVideoStatusTool
 */
interface CheckVideoStatusResult extends ToolResult {
  name: 'checkVideoStatus'
  result: {
    invocationArn: string
    status: 'InProgress' | 'Completed' | 'Failed'
    submitTime: Date
    endTime?: Date
    s3Location?: string
    error?: string
    progress?: {
      percentage?: number
      estimatedTimeRemaining?: string
    }
  }
}

/**
 * Tool for checking video generation status
 */
export class CheckVideoStatusTool extends BaseTool<CheckVideoStatusInput, CheckVideoStatusResult> {
  static readonly toolName = 'checkVideoStatus'
  static readonly toolDescription =
    'Check the status of video generation job using invocation ARN. Returns current status, completion time, and S3 location if completed.'

  readonly name = CheckVideoStatusTool.toolName
  readonly description = CheckVideoStatusTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: CheckVideoStatusTool.toolName,
    description: CheckVideoStatusTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          invocationArn: {
            type: 'string',
            description: 'ARN of the video generation job to check status for'
          }
        },
        required: ['invocationArn']
      }
    }
  } as const

  /**
   * System prompt description
   */
  /**
   * Validate input
   */
  protected validateInput(input: CheckVideoStatusInput): ValidationResult {
    const errors: string[] = []

    if (!input.invocationArn) {
      errors.push('Invocation ARN is required')
    }

    if (typeof input.invocationArn !== 'string') {
      errors.push('Invocation ARN must be a string')
    }

    if (input.invocationArn && input.invocationArn.trim().length === 0) {
      errors.push('Invocation ARN cannot be empty')
    }

    if (input.invocationArn && !input.invocationArn.startsWith('arn:')) {
      errors.push('Invalid invocation ARN format. Must start with "arn:"')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: CheckVideoStatusInput): Promise<CheckVideoStatusResult> {
    const { invocationArn } = input

    this.logger.debug('Checking video generation status', {
      invocationArn
    })

    try {
      // Call the main process API to check video status
      const response = await ipc('bedrock:checkVideoStatus', {
        invocationArn
      })

      this.logger.info('Video status checked successfully', {
        invocationArn,
        status: response.status,
        hasS3Location: !!response.outputDataConfig?.s3OutputDataConfig?.s3Uri
      })

      // Calculate progress information for InProgress status
      let progress: { percentage?: number; estimatedTimeRemaining?: string } | undefined
      if (response.status === 'InProgress' && response.submitTime) {
        const submitTime = new Date(response.submitTime)
        const now = new Date()
        const elapsedMinutes = Math.floor((now.getTime() - submitTime.getTime()) / (1000 * 60))

        // Rough estimate: video generation takes about 1.5x the video duration in minutes
        // This is a heuristic and may not be accurate
        if (elapsedMinutes > 0) {
          progress = {
            estimatedTimeRemaining: `${Math.max(0, 5 - elapsedMinutes)} minutes (estimated)`
          }
        }
      }

      const statusMessage = this.getStatusMessage(
        response.status,
        response.outputDataConfig?.s3OutputDataConfig?.s3Uri
      )

      return {
        success: true,
        name: 'checkVideoStatus',
        message: statusMessage,
        result: {
          invocationArn,
          status: response.status as 'InProgress' | 'Completed' | 'Failed',
          submitTime: new Date(response.submitTime || Date.now()),
          endTime: response.endTime ? new Date(response.endTime) : undefined,
          s3Location: response.outputDataConfig?.s3OutputDataConfig?.s3Uri,
          error: response.status === 'Failed' ? response.failureMessage : undefined,
          progress
        }
      }
    } catch (error) {
      this.logger.error('Error checking video status', {
        error: error instanceof Error ? error.message : String(error),
        invocationArn
      })

      throw new ExecutionError(
        `Error checking video status: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        {
          invocationArn
        }
      )
    }
  }

  /**
   * Get status message based on current status
   */
  private getStatusMessage(status: string, s3Location?: string): string {
    switch (status) {
      case 'InProgress':
        return 'Video generation is in progress. Check again in a few minutes.'
      case 'Completed':
        return s3Location
          ? `Video generation completed successfully. S3 location: ${s3Location}. Use downloadVideo to download the video.`
          : 'Video generation completed successfully.'
      case 'Failed':
        return 'Video generation failed. Check the error details for more information.'
      default:
        return `Video generation status: ${status}`
    }
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }

  /**
   * Override to sanitize input for logging
   */
  protected sanitizeInputForLogging(input: CheckVideoStatusInput): any {
    return {
      ...input,
      invocationArn: input.invocationArn ? '***provided***' : '***not provided***'
    }
  }
}
