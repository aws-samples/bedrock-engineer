import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import { BedrockClient } from '@aws-sdk/client-bedrock'
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime'
import { TranslateClient } from '@aws-sdk/client-translate'
import { fromIni } from '@aws-sdk/credential-providers'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { NovaSonicBidirectionalStreamClient } from '../sonic/client'
import type { AWSCredentials } from './types'
import { S3Client } from '@aws-sdk/client-s3'
import { createHttpOptions } from '../../lib/proxy-utils'

export function createS3Client(awsCredentials: AWSCredentials) {
  const { region, useProfile, profile, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  if (useProfile) {
    return new S3Client({
      region,
      credentials: fromIni({ profile }),
      ...httpOptions
    })
  }

  return new S3Client({
    region,
    credentials,
    ...httpOptions
  })
}

export function createRuntimeClient(awsCredentials: AWSCredentials) {
  const { region, useProfile, profile, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  // Add default timeout configuration if no custom handler is provided
  const defaultHttpOptions = Object.keys(httpOptions).length === 0 
    ? {
        requestHandler: new NodeHttpHandler({
          requestTimeout: 300000, // 5 minutes for long-running operations
          connectionTimeout: 30000 // 30 seconds for connection establishment
        })
      }
    : httpOptions

  if (useProfile) {
    return new BedrockRuntimeClient({
      region,
      credentials: fromIni({ profile }),
      ...defaultHttpOptions
    })
  }

  return new BedrockRuntimeClient({
    region,
    credentials,
    ...defaultHttpOptions
  })
}

export function createBedrockClient(awsCredentials: AWSCredentials) {
  const { region, useProfile, profile, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  if (useProfile) {
    return new BedrockClient({
      region,
      credentials: fromIni({ profile }),
      ...httpOptions
    })
  }

  return new BedrockClient({
    region,
    credentials,
    ...httpOptions
  })
}

export function createAgentRuntimeClient(awsCredentials: AWSCredentials) {
  const { region, useProfile, profile, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  // Add default timeout configuration if no custom handler is provided
  const defaultHttpOptions = Object.keys(httpOptions).length === 0 
    ? {
        requestHandler: new NodeHttpHandler({
          requestTimeout: 300000, // 5 minutes for long-running agent operations
          connectionTimeout: 30000 // 30 seconds for connection establishment
        })
      }
    : httpOptions

  if (useProfile) {
    return new BedrockAgentRuntimeClient({
      region,
      credentials: fromIni({ profile }),
      ...defaultHttpOptions
    })
  }

  return new BedrockAgentRuntimeClient({
    region,
    credentials,
    ...defaultHttpOptions
  })
}

export function createNovaSonicClient(awsCredentials: AWSCredentials) {
  const { region, useProfile, profile, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  const clientConfig = useProfile
    ? { region, credentials: fromIni({ profile }), ...httpOptions }
    : { region, credentials, ...httpOptions }

  return new NovaSonicBidirectionalStreamClient({
    requestHandlerConfig: {
      maxConcurrentStreams: 10
    },
    clientConfig
  })
}

export function createTranslateClient(awsCredentials: AWSCredentials) {
  const { region, useProfile, profile, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  if (useProfile) {
    return new TranslateClient({
      region,
      credentials: fromIni({ profile }),
      ...httpOptions
    })
  }

  return new TranslateClient({
    region,
    credentials,
    ...httpOptions
  })
}
