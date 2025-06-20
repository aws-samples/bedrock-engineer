require('dotenv').config()

// Add any additional setup code here
console.log('Integration test environment variables loaded:', {
  AWS_REGION: process.env.AWS_REGION,
  AWS_PROFILE: process.env.AWS_PROFILE,
  INTEGRATION_TEST: process.env.INTEGRATION_TEST,
  // Mask sensitive credentials in logs (fallback)
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '***' : undefined,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '***' : undefined
})
