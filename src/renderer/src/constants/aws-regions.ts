export interface AwsRegion {
  id: string
  name: string
  bedrockSupported: boolean
}

// Amazon Bedrock がサポートされているリージョン
// 参考: https://docs.aws.amazon.com/general/latest/gr/bedrock.html
export const AWS_REGIONS: AwsRegion[] = [
  {
    id: 'us-east-1',
    name: 'US East (N. Virginia)',
    bedrockSupported: true
  },
  {
    id: 'us-east-2',
    name: 'US East (Ohio)',
    bedrockSupported: true
  },
  {
    id: 'us-west-2',
    name: 'US West (Oregon)',
    bedrockSupported: true
  },
  {
    id: 'ap-northeast-1',
    name: 'Asia Pacific (Tokyo)',
    bedrockSupported: true
  },
  {
    id: 'ap-northeast-2',
    name: 'Asia Pacific (Soul)',
    bedrockSupported: true
  },
  {
    id: 'ap-northeast-3',
    name: 'Asia Pacific (Osaka)',
    bedrockSupported: true
  },
  {
    id: 'ap-southeast-1',
    name: 'Asia Pacific (Singapore)',
    bedrockSupported: true
  },
  {
    id: 'eu-central-1',
    name: 'Europe (Frankfurt)',
    bedrockSupported: true
  },
  // その他の主要なリージョン（Bedrock非対応）
  {
    id: 'us-west-1',
    name: 'US West (N. California)',
    bedrockSupported: false
  },
  {
    id: 'ap-south-1',
    name: 'Asia Pacific (Mumbai)',
    bedrockSupported: false
  },
  {
    id: 'ap-southeast-2',
    name: 'Asia Pacific (Sydney)',
    bedrockSupported: false
  },
  {
    id: 'eu-west-1',
    name: 'Europe (Ireland)',
    bedrockSupported: false
  },
  {
    id: 'eu-west-2',
    name: 'Europe (London)',
    bedrockSupported: false
  }
]
