import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'
import { BedrockClient } from '@aws-sdk/client-bedrock'
import { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime'
import type { AWSCredentials } from './types'

export function createRuntimeClient(awsCredentials: AWSCredentials) {
  const { region, ...credentials } = awsCredentials
  return new BedrockRuntimeClient({
    region,
    credentials
  })
}

export function createBedrockClient(awsCredentials: AWSCredentials) {
  const { region, ...credentials } = awsCredentials
  return new BedrockClient({
    region,
    credentials
  })
}

export function createAgentRuntimeClient(awsCredentials: AWSCredentials) {
  const { region, ...credentials } = awsCredentials
  return new BedrockAgentRuntimeClient({
    region,
    credentials
  })
}
