import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import { BedrockClient } from '@aws-sdk/client-bedrock'
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime'
import { TranslateClient } from '@aws-sdk/client-translate'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { NovaSonicBidirectionalStreamClient } from '../sonic/client'
import { S3Client } from '@aws-sdk/client-s3'
import { createHttpOptions } from '../../lib/proxy-utils'

export function createS3Client(awsCredentials) {
  const { region, profile } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  return new S3Client({
    region,
    credentials: defaultProvider({
      profile
    }),
    ...httpOptions
  })
}

export function createRuntimeClient(awsCredentials) {
  const { region, profile } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  return new BedrockRuntimeClient({
    region,
    credentials: defaultProvider({
      profile
    }),
    ...httpOptions
  })
}

export function createBedrockClient(awsCredentials) {
  const { region, profile } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  return new BedrockClient({
    region,
    credentials: defaultProvider({
      profile
    }),
    ...httpOptions
  })
}

export function createAgentRuntimeClient(awsCredentials) {
  const { region, profile } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  return new BedrockAgentRuntimeClient({
    region,
    credentials: defaultProvider({
      profile
    }),
    ...httpOptions
  })
}

export function createNovaSonicClient(awsCredentials) {
  const { region, profile } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  return new NovaSonicBidirectionalStreamClient({
    requestHandlerConfig: {
      maxConcurrentStreams: 10
    },
    clientConfig: {
      region,
      credentials: defaultProvider({
        profile
      }),
      ...httpOptions
    }
  })
}

export function createTranslateClient(awsCredentials) {
  const { region, profile } = awsCredentials
  const httpOptions = createHttpOptions(awsCredentials)

  return new TranslateClient({
    region,
    credentials: defaultProvider({
      profile
    }),
    ...httpOptions
  })
}
