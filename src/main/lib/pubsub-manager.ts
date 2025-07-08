import { WebContents } from 'electron'
import { createCategoryLogger } from '../../common/logger'

const logger = createCategoryLogger('pubsub')

/**
 * Pub-Sub system for IPC communication
 * Manages subscribers for different channels and handles message publishing
 */
export class PubSubManager {
  private subscribers: Map<string, Set<WebContents>> = new Map()
  private static instance: PubSubManager | null = null

  constructor() {
    logger.debug('PubSubManager initialized')
  }

  /**
   * Get singleton instance
   */
  static getInstance(): PubSubManager {
    if (!PubSubManager.instance) {
      PubSubManager.instance = new PubSubManager()
    }
    return PubSubManager.instance
  }

  /**
   * Subscribe a WebContents to a channel
   */
  subscribe(channel: string, webContents: WebContents): void {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set())
    }

    this.subscribers.get(channel)!.add(webContents)

    logger.debug('Subscription added', {
      channel,
      subscriberCount: this.subscribers.get(channel)!.size
    })

    // Clean up when webContents is destroyed
    webContents.once('destroyed', () => {
      this.unsubscribe(channel, webContents)
    })
  }

  /**
   * Unsubscribe a WebContents from a channel
   */
  unsubscribe(channel: string, webContents: WebContents): void {
    const channelSubscribers = this.subscribers.get(channel)
    if (channelSubscribers) {
      channelSubscribers.delete(webContents)

      // Remove channel if no subscribers left
      if (channelSubscribers.size === 0) {
        this.subscribers.delete(channel)
        logger.debug('Channel removed (no subscribers)', { channel })
      } else {
        logger.debug('Subscription removed', {
          channel,
          subscriberCount: channelSubscribers.size
        })
      }
    }
  }

  /**
   * Unsubscribe a WebContents from all channels
   */
  unsubscribeAll(webContents: WebContents): void {
    const channelsToClean: string[] = []

    for (const [channel, subscribers] of this.subscribers.entries()) {
      if (subscribers.has(webContents)) {
        subscribers.delete(webContents)
        if (subscribers.size === 0) {
          channelsToClean.push(channel)
        }
      }
    }

    // Clean up empty channels
    channelsToClean.forEach((channel) => {
      this.subscribers.delete(channel)
    })

    logger.debug('Unsubscribed from all channels', {
      channelsAffected: channelsToClean.length
    })
  }

  /**
   * Publish a message to all subscribers of a channel
   */
  publish(channel: string, data: any): void {
    const channelSubscribers = this.subscribers.get(channel)
    if (!channelSubscribers || channelSubscribers.size === 0) {
      logger.debug('No subscribers for channel', { channel })
      return
    }

    const validSubscribers: WebContents[] = []
    const invalidSubscribers: WebContents[] = []

    // Filter out destroyed WebContents
    for (const webContents of channelSubscribers) {
      if (webContents.isDestroyed()) {
        invalidSubscribers.push(webContents)
      } else {
        validSubscribers.push(webContents)
      }
    }

    // Clean up invalid subscribers
    invalidSubscribers.forEach((webContents) => {
      channelSubscribers.delete(webContents)
    })

    // Send message to valid subscribers
    let successCount = 0
    for (const webContents of validSubscribers) {
      try {
        webContents.send(channel, data)
        successCount++
      } catch (error) {
        logger.warn('Failed to send message to subscriber', {
          channel,
          error: error instanceof Error ? error.message : String(error)
        })
        // Remove failed subscriber
        channelSubscribers.delete(webContents)
      }
    }

    logger.debug('Message published', {
      channel,
      subscriberCount: validSubscribers.length,
      successCount,
      failedCount: validSubscribers.length - successCount,
      invalidSubscribers: invalidSubscribers.length
    })

    // Clean up channel if no valid subscribers remain
    if (channelSubscribers.size === 0) {
      this.subscribers.delete(channel)
      logger.debug('Channel removed after publishing (no valid subscribers)', { channel })
    }
  }

  /**
   * Get subscription statistics
   */
  getStats(): {
    totalChannels: number
    totalSubscribers: number
    channels: Array<{ channel: string; subscriberCount: number }>
  } {
    const channels = Array.from(this.subscribers.entries()).map(([channel, subscribers]) => ({
      channel,
      subscriberCount: subscribers.size
    }))

    const totalSubscribers = channels.reduce((sum, { subscriberCount }) => sum + subscriberCount, 0)

    return {
      totalChannels: this.subscribers.size,
      totalSubscribers,
      channels
    }
  }

  /**
   * Clean up all subscriptions (for shutdown)
   */
  cleanup(): void {
    this.subscribers.clear()
    logger.info('PubSubManager cleanup completed')
  }
}

// Export singleton instance
export const pubSubManager = PubSubManager.getInstance()
