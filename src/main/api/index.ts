import express, { Request, Response, ErrorRequestHandler } from 'express'
import cors from 'cors'
import { RequestHandler, NextFunction } from 'express'
import { RetrieveAndGenerateCommandInput } from '@aws-sdk/client-bedrock-agent-runtime'
import { BedrockService, CallConverseAPIProps } from './bedrock'
import { createNovaSonicClient } from './bedrock/client'
import { store } from '../../preload/store'
import { createCategoryLogger } from '../../common/logger'
import { Server } from 'socket.io'
import http from 'http'
import { SonicToolExecutor } from './sonic/tool-executor'
import { checkNovaSonicRegionSupport, testBedrockConnectivity } from './sonic/regionCheck'

// Create category logger for API
const apiLogger = createCategoryLogger('api:express')
const bedrockLogger = createCategoryLogger('api:bedrock')

export const bedrock = new BedrockService({ store })

interface PromiseRequestHandler {
  (req: Request, res: Response, next: NextFunction): Promise<unknown>
}

function wrap(fn: PromiseRequestHandler): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next)
}

// Error handling middleware
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  apiLogger.error('Express error', {
    path: req.path,
    method: req.method,
    error: err instanceof Error ? err.stack : String(err)
  })

  res.status(500).json({
    error: {
      message: err instanceof Error ? err.message : String(err)
    }
  })
}

// アプリケーションで動作するようにdotenvを設定する
const api = express()
const server = http.createServer(api)

const allowedOrigins = ['http://localhost:5173']
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
})

api.use(
  cors({
    origin: allowedOrigins
  })
)
api.use(express.json({ limit: '10mb' }))
api.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Add request logging
api.use((req, res, next) => {
  const start = Date.now()

  // Log when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start
    apiLogger.debug(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    })
  })

  next()
})

api.get('/', (_req: Request, res: Response) => {
  res.send('Hello World')
})

interface CustomRequest<T> extends Request {
  body: T
}

type ConverseStreamRequest = CustomRequest<CallConverseAPIProps>

api.post(
  '/converse/stream',
  wrap(async (req: ConverseStreamRequest, res) => {
    res.setHeader('Content-Type', 'text/event-stream;charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')

    try {
      const result = await bedrock.converseStream(req.body)

      if (!result.stream) {
        return res.end()
      }

      for await (const item of result.stream) {
        res.write(JSON.stringify(item) + '\n')
      }
    } catch (error: any) {
      bedrockLogger.error('Stream conversation error', {
        errorName: error.name,
        message: error.message,
        stack: error.stack,
        modelId: req.body.modelId
      })

      if (error.name === 'ValidationException') {
        return res.status(400).send({
          ...error,
          message: error.message
        })
      }

      return res.status(500).send(error)
    }

    return res.end()
  })
)

type ConverseRequest = CustomRequest<CallConverseAPIProps>

api.post(
  '/converse',
  wrap(async (req: ConverseRequest, res) => {
    res.setHeader('Content-Type', 'application/json')

    try {
      const result = await bedrock.converse(req.body)
      return res.json(result)
    } catch (error: any) {
      bedrockLogger.error('Conversation error', {
        errorName: error.name,
        message: error.message,
        stack: error.stack,
        modelId: req.body.modelId
      })
      return res.status(500).send(error)
    }
  })
)

type RetrieveAndGenerateCommandInputRequest = CustomRequest<RetrieveAndGenerateCommandInput>

api.post(
  '/retrieveAndGenerate',
  wrap(async (req: RetrieveAndGenerateCommandInputRequest, res) => {
    res.setHeader('Content-Type', 'application/json')
    try {
      const result = await bedrock.retrieveAndGenerate(req.body)
      return res.json(result)
    } catch (error: any) {
      bedrockLogger.error('RetrieveAndGenerate error', {
        errorName: error.name,
        message: error.message,
        stack: error.stack,
        // Type safety: knowledgeBaseId is accessed differently in RetrieveAndGenerateCommandInput
        knowledgeBaseId: (req.body as any).knowledgeBaseId || 'unknown'
      })

      if (error.name === 'ResourceNotFoundException') {
        return res.status(404).send({
          ...error,
          message: error.message
        })
      }
      return res.status(500).send(error)
    }
  })
)

api.get(
  '/listModels',
  wrap(async (_req: Request, res) => {
    res.setHeader('Content-Type', 'application/json')
    try {
      const result = await bedrock.listModels()
      return res.json(result)
    } catch (error: any) {
      bedrockLogger.error('ListModels error', {
        errorName: error.name,
        message: error.message,
        stack: error.stack
      })
      return res.status(500).send(error)
    }
  })
)

// Nova Sonic region support check endpoint
api.get(
  '/nova-sonic/region-check',
  wrap(async (req: Request, res) => {
    res.setHeader('Content-Type', 'application/json')
    try {
      const region = typeof req.query.region === 'string' ? req.query.region : undefined
      const result = await checkNovaSonicRegionSupport(region)
      return res.json(result)
    } catch (error: any) {
      apiLogger.error('Nova Sonic region check error', {
        errorName: error.name,
        message: error.message,
        stack: error.stack
      })
      return res.status(500).send({
        error: {
          message: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })
)

// Bedrock connectivity test endpoint
api.get(
  '/bedrock/connectivity-test',
  wrap(async (req: Request, res) => {
    res.setHeader('Content-Type', 'application/json')
    try {
      const region = typeof req.query.region === 'string' ? req.query.region : undefined
      const result = await testBedrockConnectivity(region)
      return res.json(result)
    } catch (error: any) {
      apiLogger.error('Bedrock connectivity test error', {
        errorName: error.name,
        message: error.message,
        stack: error.stack
      })
      return res.status(500).send({
        error: {
          message: error instanceof Error ? error.message : String(error)
        }
      })
    }
  })
)

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id)

  // storeからAWS設定を取得してNova Sonicクライアントを作成
  const awsConfig = store.get('aws')

  const sonicClient = createNovaSonicClient({
    region: awsConfig?.region || 'us-east-1',
    accessKeyId: awsConfig?.accessKeyId || '',
    secretAccessKey: awsConfig?.secretAccessKey || '',
    sessionToken: awsConfig?.sessionToken,
    useProfile: awsConfig?.useProfile ?? true,
    profile: awsConfig?.profile || 'default'
  })

  // Initialize tool executor and connect it to the bedrock client
  const toolExecutor = new SonicToolExecutor(io)
  sonicClient.setToolExecutor(toolExecutor)

  // Register tool execution handlers for this socket
  toolExecutor.registerSocketHandlers(socket)

  // Create a unique session ID for this client
  const sessionId = socket.id

  try {
    // Create session with the new API (but don't initiate AWS stream yet)
    const session = sonicClient.createStreamSession(sessionId)

    // Track initialization state
    const sessionState = {
      promptStartSent: false,
      systemPromptSent: false,
      audioStartSent: false,
      initialized: false
    }

    // Function to check if all setup events are received and initiate session
    const checkAndInitializeSession = async () => {
      if (
        !sessionState.initialized &&
        sessionState.promptStartSent &&
        sessionState.systemPromptSent &&
        sessionState.audioStartSent
      ) {
        try {
          console.log(`All setup events received, initiating AWS stream for session ${sessionId}`)
          sessionState.initialized = true
          await sonicClient.initiateSession(sessionId)
          console.log(`AWS stream initiated successfully for session ${sessionId}`)
        } catch (error) {
          console.error(`Error initiating session ${sessionId}:`, error)
          socket.emit('error', {
            message: 'Failed to initialize AWS streaming session',
            details: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }

    setInterval(() => {
      const connectionCount = Object.keys(io.sockets.sockets).length
      console.log(`Active socket connections: ${connectionCount}`)
    }, 60000)

    // Set up event handlers
    session.onEvent('contentStart', (data) => {
      console.log('contentStart:', data)
      socket.emit('contentStart', data)
    })

    session.onEvent('textOutput', (data) => {
      console.log('Text output:', data)
      socket.emit('textOutput', data)
    })

    session.onEvent('audioOutput', (data) => {
      socket.emit('audioOutput', data)
    })

    session.onEvent('error', (data) => {
      console.error('Error in session:', data)
      socket.emit('error', data)
    })

    session.onEvent('toolUse', (data) => {
      console.log('Tool use detected:', data.toolName)
      socket.emit('toolUse', data)
    })

    session.onEvent('toolResult', (data) => {
      console.log('Tool result received')
      socket.emit('toolResult', data)
    })

    session.onEvent('contentEnd', (data) => {
      console.log('Content end received: ', data)
      socket.emit('contentEnd', data)
    })

    session.onEvent('streamComplete', () => {
      console.log('Stream completed for client:', socket.id)
      socket.emit('streamComplete')
    })

    // Simplified audioInput handler without rate limiting
    socket.on('audioInput', async (audioData) => {
      try {
        // Convert base64 string to Buffer
        const audioBuffer =
          typeof audioData === 'string' ? Buffer.from(audioData, 'base64') : Buffer.from(audioData)

        // Stream the audio
        await session.streamAudio(audioBuffer)
      } catch (error) {
        console.error('Error processing audio:', error)
        socket.emit('error', {
          message: 'Error processing audio',
          details: error instanceof Error ? error.message : String(error)
        })
      }
    })

    socket.on('promptStart', async (data) => {
      try {
        console.log(
          'Prompt start received with tools:',
          data?.tools?.length || 0,
          'voiceId:',
          data?.voiceId
        )
        await session.setupPromptStart(data?.tools, data?.voiceId)
        sessionState.promptStartSent = true
        await checkAndInitializeSession()
      } catch (error) {
        console.error('Error processing prompt start:', error)
        socket.emit('error', {
          message: 'Error processing prompt start',
          details: error instanceof Error ? error.message : String(error)
        })
      }
    })

    socket.on('systemPrompt', async (data) => {
      try {
        console.log('System prompt received', data)
        await session.setupSystemPrompt(undefined, data)
        sessionState.systemPromptSent = true
        await checkAndInitializeSession()
      } catch (error) {
        console.error('Error processing system prompt:', error)
        socket.emit('error', {
          message: 'Error processing system prompt',
          details: error instanceof Error ? error.message : String(error)
        })
      }
    })

    socket.on('audioStart', async (data) => {
      try {
        console.log('Audio start received', data)
        await session.setupStartAudio()
        sessionState.audioStartSent = true
        await checkAndInitializeSession()
      } catch (error) {
        console.error('Error processing audio start:', error)
        socket.emit('error', {
          message: 'Error processing audio start',
          details: error instanceof Error ? error.message : String(error)
        })
      }
    })

    socket.on('stopAudio', async () => {
      try {
        console.log('Stop audio requested, beginning proper shutdown sequence')

        // Chain the closing sequence
        await Promise.all([
          session
            .endAudioContent()
            .then(() => session.endPrompt())
            .then(() => session.close())
            .then(() => console.log('Session cleanup complete'))
        ])
      } catch (error) {
        console.error('Error processing streaming end events:', error)
        socket.emit('error', {
          message: 'Error processing streaming end events',
          details: error instanceof Error ? error.message : String(error)
        })
      }
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected abruptly:', socket.id)

      if (sonicClient.isSessionActive(sessionId)) {
        try {
          console.log(`Beginning cleanup for abruptly disconnected session: ${socket.id}`)

          // Add explicit timeouts to avoid hanging promises
          const cleanupPromise = Promise.race([
            (async () => {
              await session.endAudioContent()
              await session.endPrompt()
              await session.close()
            })(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Session cleanup timeout')), 3000)
            )
          ])

          await cleanupPromise
          console.log(`Successfully cleaned up session after abrupt disconnect: ${socket.id}`)
        } catch (error) {
          console.error(`Error cleaning up session after disconnect: ${socket.id}`, error)
          try {
            sonicClient.forceCloseSession(sessionId)
            console.log(`Force closed session: ${sessionId}`)
          } catch (e) {
            console.error(`Failed even force close for session: ${sessionId}`, e)
          }
        } finally {
          // Make sure socket is fully closed in all cases
          if (socket.connected) {
            socket.disconnect(true)
          }
        }
      }
    })
  } catch (error) {
    console.error('Error creating session:', error)
    socket.emit('error', {
      message: 'Failed to initialize session',
      details: error instanceof Error ? error.message : String(error)
    })
    socket.disconnect()
  }
})

// Add error handling middleware last
api.use(errorHandler)

export { server }
