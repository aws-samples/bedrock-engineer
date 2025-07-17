/**
 * DownloadVideo tool implementation
 */

import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { promises as fs } from 'fs'
import * as path from 'path'
import { ipc } from '../../../ipc-client'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import { ToolResult } from '../../../../types/tools'

/**
 * Input type for DownloadVideoTool
 */
interface DownloadVideoInput {
  type: 'downloadVideo'
  invocationArn: string
  localPath?: string
}

/**
 * Result type for DownloadVideoTool
 */
interface DownloadVideoResult extends ToolResult {
  name: 'downloadVideo'
  result: {
    downloadedPath: string
    fileSize: number
    invocationArn: string
    downloadTime?: number
  }
}

/**
 * Tool for downloading completed video from S3
 */
export class DownloadVideoTool extends BaseTool<DownloadVideoInput, DownloadVideoResult> {
  static readonly toolName = 'downloadVideo'
  static readonly toolDescription =
    'Download a completed video from S3 using invocation ARN. Automatically retrieves S3 location from job status and downloads to local path.'

  readonly name = DownloadVideoTool.toolName
  readonly description = DownloadVideoTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: DownloadVideoTool.toolName,
    description: DownloadVideoTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          invocationArn: {
            type: 'string',
            description: 'ARN of the completed video generation job'
          },
          localPath: {
            type: 'string',
            description:
              'Optional. Local path to save the video file. Uses project path with timestamp if not specified.'
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
  protected validateInput(input: DownloadVideoInput): ValidationResult {
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

    if (input.localPath !== undefined && typeof input.localPath !== 'string') {
      errors.push('Local path must be a string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: DownloadVideoInput): Promise<DownloadVideoResult> {
    const { invocationArn, localPath } = input
    const startTime = Date.now()

    this.logger.debug('Starting video download', {
      invocationArn,
      localPath
    })

    try {
      // First, check the job status to get S3 location
      const statusResponse = await ipc('bedrock:checkVideoStatus', {
        invocationArn
      })

      if (statusResponse.status !== 'Completed') {
        throw new ExecutionError(
          `Video generation is not completed yet. Current status: ${statusResponse.status}`,
          this.name,
          undefined,
          {
            invocationArn,
            currentStatus: statusResponse.status
          }
        )
      }

      const s3Uri = statusResponse.outputDataConfig?.s3OutputDataConfig?.s3Uri + '/output.mp4'
      if (!s3Uri) {
        throw new ExecutionError('S3 location not found in job status', this.name, undefined, {
          invocationArn,
          statusResponse
        })
      }

      // Determine final local path
      let finalLocalPath = localPath
      if (!finalLocalPath) {
        // Get project path from store
        const projectPath = this.store.get('projectPath')
        if (projectPath) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          finalLocalPath = path.join(projectPath, `downloaded-video-${timestamp}.mp4`)
        } else {
          // Fallback to current directory
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          finalLocalPath = `downloaded-video-${timestamp}.mp4`
        }
      }

      // Ensure the file has a .mp4 extension
      if (!finalLocalPath.endsWith('.mp4')) {
        finalLocalPath = `${finalLocalPath}.mp4`
      }

      this.logger.info('Downloading video from S3', {
        invocationArn,
        s3Uri,
        localPath: finalLocalPath
      })

      // Download the video
      const downloadResponse = await ipc('bedrock:downloadVideo', {
        s3Uri,
        localPath: finalLocalPath
      })

      const downloadTime = Date.now() - startTime

      // Verify the downloaded file
      try {
        await fs.access(downloadResponse.downloadedPath)
        const stats = await fs.stat(downloadResponse.downloadedPath)

        if (stats.size === 0) {
          this.logger.warn('Downloaded video file is empty', {
            path: downloadResponse.downloadedPath
          })
        }

        this.logger.info('Video downloaded successfully', {
          invocationArn,
          downloadedPath: downloadResponse.downloadedPath,
          fileSize: downloadResponse.fileSize,
          downloadTime
        })

        return {
          success: true,
          name: 'downloadVideo',
          message: `Video downloaded successfully to ${downloadResponse.downloadedPath} (${Math.round((downloadResponse.fileSize / 1024 / 1024) * 100) / 100} MB)`,
          result: {
            downloadedPath: downloadResponse.downloadedPath,
            fileSize: downloadResponse.fileSize,
            invocationArn,
            downloadTime
          }
        }
      } catch (verifyError) {
        this.logger.warn('Failed to verify downloaded video', {
          path: downloadResponse.downloadedPath,
          error: verifyError instanceof Error ? verifyError.message : String(verifyError)
        })

        // Still return success since download completed
        return {
          success: true,
          name: 'downloadVideo',
          message: `Video downloaded to ${downloadResponse.downloadedPath} but file verification failed`,
          result: {
            downloadedPath: downloadResponse.downloadedPath,
            fileSize: downloadResponse.fileSize,
            invocationArn,
            downloadTime
          }
        }
      }
    } catch (error) {
      this.logger.error('Error downloading video', {
        error: error instanceof Error ? error.message : String(error),
        invocationArn,
        localPath
      })

      throw new ExecutionError(
        `Error downloading video: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined,
        {
          invocationArn,
          localPath
        }
      )
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
  protected sanitizeInputForLogging(input: DownloadVideoInput): any {
    return {
      ...input,
      invocationArn: input.invocationArn ? '***provided***' : '***not provided***'
    }
  }
}
