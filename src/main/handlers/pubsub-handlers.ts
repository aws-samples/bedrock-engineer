import { pubSubManager } from '../lib/pubsub-manager'
import { createCategoryLogger } from '../../common/logger'

const logger = createCategoryLogger('pubsub:ipc')

export const pubsubHandlers = {
  'pubsub:subscribe': async (event: any, { channel }: { channel: string }) => {
    try {
      pubSubManager.subscribe(channel, event.sender)
      logger.debug('Subscription request handled', { channel })
    } catch (error) {
      logger.error('Failed to handle subscription', {
        channel,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  'pubsub:unsubscribe': async (event: any, { channel }: { channel: string }) => {
    try {
      pubSubManager.unsubscribe(channel, event.sender)
      logger.debug('Unsubscription request handled', { channel })
    } catch (error) {
      logger.error('Failed to handle unsubscription', {
        channel,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  'pubsub:publish': async (_event: any, { channel, data }: { channel: string; data: any }) => {
    try {
      pubSubManager.publish(channel, data)
      logger.debug('Publish request handled', { channel })
    } catch (error) {
      logger.error('Failed to handle publish', {
        channel,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  'pubsub:stats': async () => {
    try {
      const stats = pubSubManager.getStats()
      logger.debug('Stats request handled', stats)
      return stats
    } catch (error) {
      logger.error('Failed to get stats', {
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }
}
