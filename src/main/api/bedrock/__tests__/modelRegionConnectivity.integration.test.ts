import { describe, test, expect } from '@jest/globals'
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'
import type { Message } from '@aws-sdk/client-bedrock-runtime'
import { allModels } from '../../../../common/models/models'
import type { BedrockSupportRegion } from '../../../../types/llm'

// Skip these tests if not in integration test environment
const INTEGRATION_TEST = process.env.INTEGRATION_TEST === 'true'

// Test regions - all regions where Bedrock models are available
// To test all regions, uncomment all entries
// For quick testing, comment out regions you don't need
const TEST_REGIONS: BedrockSupportRegion[] = [
  'us-east-1',
  'us-west-2',
  'us-east-2',
  'us-west-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-north-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2'
]

// Create Bedrock Runtime Client
// AWS SDK will automatically use credentials from ~/.aws/credentials
// based on AWS_PROFILE environment variable or default profile
function createBedrockClient(region: string): BedrockRuntimeClient {
  return new BedrockRuntimeClient({
    region
    // No credentials specified - will use default credential chain:
    // 1. AWS_PROFILE environment variable
    // 2. default profile from ~/.aws/credentials
    // 3. IAM role (if running on AWS)
  })
}

// Test data structure
interface TestCase {
  modelId: string
  modelName: string
  region: string
}

// Filter models that support the test region
function getTestCasesForRegion(region: string): TestCase[] {
  const testCases: TestCase[] = []

  allModels.forEach((model) => {
    if (model.regions?.includes(region as any)) {
      testCases.push({
        modelId: model.modelId,
        modelName: model.modelName,
        region
      })
    }
  })

  return testCases
}

// Test a single model in a region
async function testModel(
  bedrockClient: BedrockRuntimeClient,
  testCase: TestCase
): Promise<{ success: boolean; error?: any }> {
  const { modelId, modelName, region } = testCase

  // Simple test message
  const messages: Message[] = [
    {
      role: 'user',
      content: [{ text: 'Hello' }]
    }
  ]

  try {
    // Prepare inference config
    // Some models (Claude Sonnet 4.5, Nova models) don't support both temperature and topP
    const inferenceConfig: any = {
      maxTokens: 10,
      temperature: 1
    }

    // Only add topP if the model doesn't have restrictions
    const skipTopP =
      modelId.includes('claude-sonnet-4-5') ||
      modelId.includes('nova-') ||
      modelId.includes('nova.')

    if (!skipTopP) {
      inferenceConfig.topP = 0.9
    }

    // Call Converse API directly
    const command = new ConverseCommand({
      modelId,
      messages,
      system: [{ text: 'You are a helpful assistant.' }],
      inferenceConfig
    })

    const response = await bedrockClient.send(command)

    // Wait a bit to avoid throttling
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Verify response structure
    if (
      !response ||
      !response.$metadata ||
      response.$metadata.httpStatusCode !== 200 ||
      !response.output
    ) {
      throw new Error('Invalid response structure')
    }

    console.log(`✓ ${modelName} (${modelId}) @ ${region}: Connected successfully`)
    return { success: true }
  } catch (error: any) {
    console.error(`✗ ${modelName} (${modelId}) @ ${region}: ${error.name} - ${error.message}`)

    // Re-throw certain errors that should fail the test
    if (error.name === 'ValidationException' || error.name === 'InvalidRequestException') {
      return { success: false, error }
    }

    // For other errors, just log
    return { success: false, error }
  }
}

// Test all models in a region sequentially
async function testRegion(region: BedrockSupportRegion): Promise<{
  region: string
  total: number
  passed: number
  failed: number
  errors: Array<{ modelName: string; error: any }>
}> {
  console.log(`\n--- Testing models in ${region} ---`)

  const bedrockClient = createBedrockClient(region)
  const testCases = getTestCasesForRegion(region)

  console.log(`Found ${testCases.length} models to test in ${region}\n`)

  let passed = 0
  let failed = 0
  const errors: Array<{ modelName: string; error: any }> = []

  // Test models sequentially within the region to avoid throttling
  for (const testCase of testCases) {
    const result = await testModel(bedrockClient, testCase)

    if (result.success) {
      passed++
    } else {
      failed++
      if (result.error) {
        errors.push({ modelName: testCase.modelName, error: result.error })
      }
    }
  }

  console.log(`\n--- Completed ${region}: ${passed}/${testCases.length} passed ---\n`)

  return {
    region,
    total: testCases.length,
    passed,
    failed,
    errors
  }
}

// Only run these tests if INTEGRATION_TEST is true
;(INTEGRATION_TEST ? describe : describe.skip)('Model Region Connectivity Tests', () => {
  test('Test all regions in parallel', async () => {
    console.log(`\n=== Testing across ${TEST_REGIONS.length} regions ===`)
    console.log(`Using AWS Profile: ${process.env.AWS_PROFILE || 'default'}`)
    console.log('Regions will be tested in PARALLEL for maximum speed\n')

    const startTime = Date.now()

    // Execute all regions in parallel using Promise.all
    const results = await Promise.all(TEST_REGIONS.map((region) => testRegion(region)))

    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    // Summarize results
    console.log('\n=== Test Summary ===')
    console.log(`Total Duration: ${duration}s`)
    console.log(`Regions Tested: ${results.length}\n`)

    let totalTests = 0
    let totalPassed = 0
    let _totalFailed = 0

    results.forEach((result) => {
      totalTests += result.total
      totalPassed += result.passed
      _totalFailed += result.failed

      console.log(`${result.region}: ${result.passed}/${result.total} passed`)

      // Log errors that should cause test failure
      result.errors.forEach((err) => {
        if (
          err.error?.name === 'ValidationException' ||
          err.error?.name === 'InvalidRequestException'
        ) {
          console.error(`  ✗ ${err.modelName}: ${err.error.message}`)
        }
      })
    })

    console.log(`\nOverall: ${totalPassed}/${totalTests} tests passed`)
    console.log('=== All Regions Test Completed ===\n')

    // Fail the test if there are any validation errors
    const hasValidationErrors = results.some((result) =>
      result.errors.some(
        (err) =>
          err.error?.name === 'ValidationException' || err.error?.name === 'InvalidRequestException'
      )
    )

    expect(hasValidationErrors).toBe(false)
    expect(totalPassed).toBe(totalTests)
  }, 300000) // 5 minute timeout for all regions
})
