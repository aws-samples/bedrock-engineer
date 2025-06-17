import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import { BedrockClient } from '@aws-sdk/client-bedrock'
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime'
import { TranslateClient } from '@aws-sdk/client-translate'
import { fromIni } from '@aws-sdk/credential-providers'
import { NovaSonicBidirectionalStreamClient } from '../sonic/client'
import type { AWSCredentials, ProxyConfiguration } from './types'
import { S3Client } from '@aws-sdk/client-s3'
import { HttpsProxyAgent } from 'https-proxy-agent'

function createHttpOptions(proxyConfig?: ProxyConfiguration) {
  if (!proxyConfig?.enabled || !proxyConfig.host) {
    return {}
  }

  const proxyUrl = new URL(
    `${proxyConfig.protocol || 'http'}://${proxyConfig.host}:${proxyConfig.port || 8080}`
  )

  if (proxyConfig.username && proxyConfig.password) {
    proxyUrl.username = proxyConfig.username
    proxyUrl.password = proxyConfig.password
  }

  const agent = new HttpsProxyAgent(proxyUrl.href)

  return {
    requestHandler: {
      httpOptions: {
        agent
      }
    }
  }
}

export function createS3Client(awsCredentials: AWSCredentials) {
  const { region, useProfile, profile, proxyConfig, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(proxyConfig)

  if (useProfile) {
    return new S3Client({
      region,
      profile,
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
  const { region, useProfile, profile, proxyConfig, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(proxyConfig)

  if (useProfile) {
    return new BedrockRuntimeClient({
      region,
      profile,
      ...httpOptions
    })
  }

  return new BedrockRuntimeClient({
    region,
    credentials,
    ...httpOptions
  })
}

export function createBedrockClient(awsCredentials: AWSCredentials) {
  const { region, useProfile, profile, proxyConfig, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(proxyConfig)

  if (useProfile) {
    return new BedrockClient({
      region,
      profile,
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
  const { region, useProfile, profile, proxyConfig, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(proxyConfig)

  if (useProfile) {
    return new BedrockAgentRuntimeClient({
      region,
      profile,
      ...httpOptions
    })
  }

  return new BedrockAgentRuntimeClient({
    region,
    credentials,
    ...httpOptions
  })
}

export function createNovaSonicClient(awsCredentials: AWSCredentials) {
  const { region, useProfile, profile, proxyConfig, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(proxyConfig)

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
  const { region, useProfile, profile, proxyConfig, ...credentials } = awsCredentials
  const httpOptions = createHttpOptions(proxyConfig)

  if (useProfile) {
    return new TranslateClient({
      region,
      profile,
      ...httpOptions
    })
  }

  return new TranslateClient({
    region,
    credentials,
    ...httpOptions
  })
}
