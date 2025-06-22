import axios, { AxiosInstance, AxiosError } from 'axios'
import { createCategoryLogger } from '../../../common/logger'

const logger = createCategoryLogger('github-client')

export interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  html_url: string
  published_at: string
  prerelease: boolean
  draft: boolean
}

export interface GitHubReleaseResponse {
  releases: GitHubRelease[]
  rateLimitRemaining?: number
  rateLimitReset?: number
  error?: string
}

export class GitHubClient {
  private client: AxiosInstance
  private readonly baseURL = 'https://api.github.com'
  private readonly userAgent = 'Bedrock Engineer Update Checker'

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'User-Agent': this.userAgent,
        Accept: 'application/vnd.github.v3+json'
      }
    })

    // レスポンスインターセプターでレート制限情報を処理
    this.client.interceptors.response.use(
      (response) => {
        const rateLimitRemaining = response.headers['x-ratelimit-remaining']

        if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
          logger.warn(`GitHub API rate limit low: ${rateLimitRemaining} requests remaining`)
        }

        return response
      },
      (error: AxiosError) => {
        if (error.response?.status === 403) {
          const _rateLimitReset = error.response.headers['x-ratelimit-reset']
          if (_rateLimitReset) {
            const resetTime = new Date(parseInt(_rateLimitReset) * 1000)
            logger.error(`GitHub API rate limit exceeded. Resets at: ${resetTime.toISOString()}`)
          }
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * Get releases for a GitHub repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param includePrerelease Whether to include prerelease versions
   * @param perPage Number of releases to fetch (max 100)
   * @returns Promise<GitHubReleaseResponse>
   */
  async getReleases(
    owner: string,
    repo: string,
    includePrerelease: boolean = false,
    perPage: number = 10
  ): Promise<GitHubReleaseResponse> {
    try {
      logger.debug(`Fetching releases for ${owner}/${repo}`)

      const response = await this.client.get(`/repos/${owner}/${repo}/releases`, {
        params: {
          per_page: Math.min(perPage, 100),
          page: 1
        }
      })

      let releases: GitHubRelease[] = response.data

      // Filter out drafts and optionally prereleases
      releases = releases.filter((release) => {
        if (release.draft) return false
        if (!includePrerelease && release.prerelease) return false
        return true
      })

      const result: GitHubReleaseResponse = {
        releases,
        rateLimitRemaining: parseInt(response.headers['x-ratelimit-remaining'] || '0'),
        rateLimitReset: parseInt(response.headers['x-ratelimit-reset'] || '0')
      }

      logger.debug(`Successfully fetched ${releases.length} releases`)
      return result
    } catch (error) {
      const axiosError = error as AxiosError
      let errorMessage = 'Unknown error occurred'

      if (axiosError.response) {
        // Server responded with error status
        const status = axiosError.response.status
        errorMessage = `GitHub API error: ${status}`

        if (status === 404) {
          errorMessage = 'Repository not found'
        } else if (status === 403) {
          errorMessage = 'API rate limit exceeded'
        } else if (status >= 500) {
          errorMessage = 'GitHub API server error'
        }
      } else if (axiosError.request) {
        // Network error
        errorMessage = 'Network error: Unable to connect to GitHub API'
      } else {
        // Other error
        errorMessage = axiosError.message || errorMessage
      }

      logger.error(`GitHub API request failed: ${errorMessage}`)

      return {
        releases: [],
        error: errorMessage
      }
    }
  }

  /**
   * Get the latest release for a repository
   * @param owner Repository owner
   * @param repo Repository name
   * @param includePrerelease Whether to include prerelease versions
   * @returns Promise<GitHubRelease | null>
   */
  async getLatestRelease(
    owner: string,
    repo: string,
    includePrerelease: boolean = false
  ): Promise<GitHubRelease | null> {
    try {
      // Fetch more releases to ensure we get the truly latest one after sorting
      const response = await this.getReleases(owner, repo, includePrerelease, 20)

      if (response.error) {
        logger.error(`Failed to get latest release: ${response.error}`)
        return null
      }

      if (response.releases.length === 0) {
        return null
      }

      // Sort releases by published_at date in descending order (newest first)
      const sortedReleases = response.releases.sort((a, b) => {
        const dateA = new Date(a.published_at).getTime()
        const dateB = new Date(b.published_at).getTime()
        return dateB - dateA // Descending order (newest first)
      })

      logger.debug(
        `Found ${sortedReleases.length} releases, latest: ${sortedReleases[0].tag_name} (${sortedReleases[0].published_at})`
      )

      return sortedReleases[0]
    } catch (error) {
      logger.error('Failed to get latest release:', { error: String(error) })
      return null
    }
  }
}

// Singleton instance
export const githubClient = new GitHubClient()
