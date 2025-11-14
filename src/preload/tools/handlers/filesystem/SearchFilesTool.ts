/**
 * SearchFiles tool implementation with regex pattern matching
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { BaseTool } from '../../base/BaseTool'
import { ValidationResult } from '../../base/types'
import { ExecutionError } from '../../base/errors'
import GitignoreLikeMatcher from '../../../lib/gitignore-like-matcher'
import { minimatch } from 'minimatch'

/**
 * Input type for SearchFilesTool
 */
interface SearchFilesInput {
  type: 'searchFiles'
  path: string
  pattern: string
  options?: {
    filePattern?: string
    ignoreFiles?: string[]
    caseSensitive?: boolean
    contextLines?: number
    maxResults?: number
    recursive?: boolean
    showLineNumbers?: boolean
  }
}

/**
 * Search match information
 */
interface SearchMatch {
  lineNumber: number
  line: string
  isMatch: boolean
}

/**
 * File search result
 */
interface FileSearchResult {
  filePath: string
  matches: SearchMatch[]
  matchCount: number
}

/**
 * Tool for searching file contents with regex patterns
 */
export class SearchFilesTool extends BaseTool<SearchFilesInput, string> {
  static readonly toolName = 'searchFiles'
  static readonly toolDescription =
    'Search for regex patterns in files within a directory. Returns matching lines with context, line numbers, and file paths. Supports file filtering, recursive search, and gitignore-style exclusions.\n\nSearch for specific patterns across your codebase to find implementations, usage examples, or debug issues.'

  readonly name = SearchFilesTool.toolName
  readonly description = SearchFilesTool.toolDescription

  /**
   * AWS Bedrock tool specification
   */
  static readonly toolSpec: Tool['toolSpec'] = {
    name: SearchFilesTool.toolName,
    description: SearchFilesTool.toolDescription,
    inputSchema: {
      json: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The directory path to search in'
          },
          pattern: {
            type: 'string',
            description: 'Regular expression pattern to search for'
          },
          options: {
            type: 'object',
            description: 'Optional search configurations',
            properties: {
              filePattern: {
                type: 'string',
                description: 'Glob pattern to filter files (e.g., "*.ts", "*.js")'
              },
              ignoreFiles: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of patterns to ignore when searching files (gitignore format)'
              },
              caseSensitive: {
                type: 'boolean',
                description: 'Whether the search should be case-sensitive (default: true)'
              },
              contextLines: {
                type: 'number',
                description: 'Number of lines to show before and after each match (default: 5)'
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of matches to return (default: 100)'
              },
              recursive: {
                type: 'boolean',
                description: 'Whether to search recursively in subdirectories (default: true)'
              },
              showLineNumbers: {
                type: 'boolean',
                description: 'Whether to show line numbers in results (default: true)'
              }
            }
          }
        },
        required: ['path', 'pattern']
      }
    }
  } as const

  /**
   * Validate input
   */
  protected validateInput(input: SearchFilesInput): ValidationResult {
    const errors: string[] = []

    // Basic validation
    if (!input.path) {
      errors.push('Path is required')
    }

    if (typeof input.path !== 'string') {
      errors.push('Path must be a string')
    }

    if (!input.pattern) {
      errors.push('Pattern is required')
    }

    if (typeof input.pattern !== 'string') {
      errors.push('Pattern must be a string')
    }

    // Validate regex pattern
    if (input.pattern) {
      try {
        new RegExp(input.pattern)
      } catch (error) {
        errors.push(
          `Invalid regex pattern: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    // Options validation
    if (input.options) {
      if (
        input.options.contextLines !== undefined &&
        (typeof input.options.contextLines !== 'number' || input.options.contextLines < 0)
      ) {
        errors.push('contextLines must be a non-negative number')
      }

      if (
        input.options.maxResults !== undefined &&
        (typeof input.options.maxResults !== 'number' || input.options.maxResults < 1)
      ) {
        errors.push('maxResults must be a positive number')
      }

      if (input.options.ignoreFiles !== undefined && !Array.isArray(input.options.ignoreFiles)) {
        errors.push('ignoreFiles must be an array')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Execute the tool
   */
  protected async executeInternal(input: SearchFilesInput): Promise<string> {
    const { path: searchPath, pattern, options = {} } = input

    // Get default ignoreFiles from store if not provided
    const agentChatConfig = this.store.get('agentChatConfig') as
      | { ignoreFiles?: string[] }
      | undefined
    const defaultIgnoreFiles = agentChatConfig?.ignoreFiles || []

    const {
      filePattern,
      ignoreFiles = defaultIgnoreFiles,
      caseSensitive = true,
      contextLines = 5,
      maxResults = 100,
      recursive = true,
      showLineNumbers = true
    } = options

    this.logger.debug(`Searching files in directory: ${searchPath}`, {
      pattern,
      options: JSON.stringify({
        filePattern,
        caseSensitive,
        contextLines,
        maxResults,
        recursive,
        ignoreFilesCount: ignoreFiles?.length || 0
      })
    })

    try {
      // Create regex pattern
      const regexFlags = caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(pattern, regexFlags)

      // Search files
      const results = await this.searchDirectory(
        searchPath,
        regex,
        filePattern,
        ignoreFiles,
        recursive,
        contextLines,
        showLineNumbers,
        maxResults
      )

      // Format results
      const formattedResults = this.formatResults(results, maxResults)

      // Log summary
      const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0)
      this.logger.info(`Search completed`, {
        searchPath,
        pattern,
        filesSearched: results.length,
        totalMatches
      })

      return formattedResults
    } catch (error) {
      this.logger.error(`Error searching files: ${searchPath}`, {
        error: error instanceof Error ? error.message : String(error)
      })

      throw new ExecutionError(
        `Error searching files: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Search directory recursively
   */
  private async searchDirectory(
    dirPath: string,
    regex: RegExp,
    filePattern: string | undefined,
    ignoreFiles: string[],
    recursive: boolean,
    contextLines: number,
    _showLineNumbers: boolean,
    maxResults: number
  ): Promise<FileSearchResult[]> {
    const results: FileSearchResult[] = []
    let totalMatches = 0

    const matcher = new GitignoreLikeMatcher(ignoreFiles)

    const searchDir = async (currentPath: string): Promise<void> => {
      if (totalMatches >= maxResults) {
        return
      }

      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true })

        for (const entry of entries) {
          if (totalMatches >= maxResults) {
            break
          }

          const fullPath = path.join(currentPath, entry.name)
          const relativePath = path.relative(process.cwd(), fullPath)

          // Check if should be ignored
          if (matcher.isIgnored(relativePath)) {
            continue
          }

          if (entry.isDirectory()) {
            if (recursive) {
              await searchDir(fullPath)
            }
          } else if (entry.isFile()) {
            // Check file pattern
            if (filePattern && !minimatch(entry.name, filePattern)) {
              continue
            }

            // Search in file
            const fileResult = await this.searchInFile(
              fullPath,
              regex,
              contextLines,
              _showLineNumbers,
              maxResults - totalMatches
            )

            if (fileResult.matchCount > 0) {
              results.push(fileResult)
              totalMatches += fileResult.matchCount
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Error reading directory: ${currentPath}`, {
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    await searchDir(dirPath)

    return results
  }

  /**
   * Search in a single file
   */
  private async searchInFile(
    filePath: string,
    regex: RegExp,
    contextLines: number,
    _showLineNumbers: boolean,
    remainingResults: number
  ): Promise<FileSearchResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')
      const matches: SearchMatch[] = []
      const matchedLineNumbers = new Set<number>()

      // Find all matching lines
      lines.forEach((line, index) => {
        if (regex.test(line)) {
          matchedLineNumbers.add(index)
        }
      })

      // If no matches, return empty result
      if (matchedLineNumbers.size === 0) {
        return {
          filePath,
          matches: [],
          matchCount: 0
        }
      }

      // Build matches with context
      const lineNumbers = Array.from(matchedLineNumbers).sort((a, b) => a - b)
      let matchCount = 0

      for (const lineNum of lineNumbers) {
        if (matchCount >= remainingResults) {
          break
        }

        // Get context lines
        const startLine = Math.max(0, lineNum - contextLines)
        const endLine = Math.min(lines.length - 1, lineNum + contextLines)

        for (let i = startLine; i <= endLine; i++) {
          matches.push({
            lineNumber: i + 1,
            line: lines[i],
            isMatch: i === lineNum
          })
        }

        // Add separator between match groups
        if (lineNum !== lineNumbers[lineNumbers.length - 1]) {
          matches.push({
            lineNumber: -1,
            line: '--',
            isMatch: false
          })
        }

        matchCount++
      }

      return {
        filePath,
        matches,
        matchCount: matchedLineNumbers.size
      }
    } catch (error) {
      this.logger.warn(`Error reading file: ${filePath}`, {
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        filePath,
        matches: [],
        matchCount: 0
      }
    }
  }

  /**
   * Format search results
   */
  private formatResults(results: FileSearchResult[], maxResults: number): string {
    if (results.length === 0) {
      return 'No matches found.'
    }

    const output: string[] = []
    const totalMatches = results.reduce((sum, r) => sum + r.matchCount, 0)
    const totalFiles = results.length

    output.push(`Search Results: ${totalMatches} match(es) in ${totalFiles} file(s)`)
    output.push('='.repeat(60))
    output.push('')

    let displayedMatches = 0

    for (const result of results) {
      if (displayedMatches >= maxResults) {
        break
      }

      const relativeFilePath = path.relative(process.cwd(), result.filePath)
      output.push(`File: ${relativeFilePath}`)
      output.push('-'.repeat(60))

      for (const match of result.matches) {
        if (match.lineNumber === -1) {
          output.push(match.line)
        } else {
          const lineNumStr = match.lineNumber.toString().padStart(4, ' ')
          const marker = match.isMatch ? ' [MATCH]' : ''
          output.push(`${lineNumStr}: ${match.line}${marker}`)

          if (match.isMatch) {
            displayedMatches++
          }
        }
      }

      output.push('')
    }

    if (totalMatches > maxResults) {
      output.push(
        `Note: Results limited to ${maxResults} matches. Total matches found: ${totalMatches}`
      )
    }

    return output.join('\n')
  }

  /**
   * Override to return error as string for compatibility
   */
  protected shouldReturnErrorAsString(): boolean {
    return true
  }
}
