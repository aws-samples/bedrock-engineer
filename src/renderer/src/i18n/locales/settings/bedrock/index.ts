export const bedrockSettings = {
  en: {
    // AWS Profile Settings
    'Use AWS Profile': 'Use AWS Profile',
    'Use credentials from ~/.aws': 'Use credentials from ~/.aws',
    'AWS Profile Name': 'AWS Profile Name',
    // Bedrock Settings
    'Enable Region Failover on ThrottlingException':
      'Enable Region Failover on ThrottlingException',
    'Failover Regions': 'Failover Regions',
    'Select regions to be used as failover targets when ThrottlingException occurs':
      'Select the failover destination region to be used when ThrottlingException occurs. If multiple failover destination regions are selected, they will be selected randomly. Please enable model access in the Amazon Bedrock management console.',
    'Add a failover region': 'Add a failover region',
    // Application Inference Profiles
    'Enable Application Inference Profiles': 'Enable Application Inference Profiles',
    'Use Application Inference Profiles for cost allocation and tracking': 'Use Application Inference Profiles for cost allocation and tracking',
    // Guardrails
    'Amazon Bedrock Guardrails': 'Amazon Bedrock Guardrails',
    'Enable Guardrails': 'Enable Guardrails',
    'When enabled, guardrails will be applied to all model interactions to filter harmful content.':
      'When enabled, guardrails will be applied to all model interactions to filter harmful content.',
    'Guardrail Identifier': 'Guardrail Identifier',
    'The ID of the guardrail you want to use': 'The ID of the guardrail you want to use',
    'Guardrail Version': 'Guardrail Version',
    'The version of the guardrail (DRAFT or a version number)':
      'The version of the guardrail (DRAFT or a version number)',
    Trace: 'Trace',
    Enabled: 'Enabled',
    Disabled: 'Disabled'
  },
  ja: {
    // AWS Profile Settings
    'Use AWS Profile': 'AWS プロファイルを使用する',
    'Use credentials from ~/.aws': '~/.aws から認証情報を使用します',
    'AWS Profile Name': 'AWS プロファイル名',
    // Bedrock Settings
    'Enable Region Failover on ThrottlingException':
      'ThrottlingException 発生時に Region Failover を有効にする',
    'Failover Regions': 'Failover Regions',
    'Select regions to be used as failover targets when ThrottlingException occurs':
      'ThrottlingException 発生時に使用するフェイルオーバー先のリージョンを選択してください。フェイルオーバー先のリージョンが複数選択されている場合、ランダムに採用されます。Amazon Bedrock のマネジメントコンソールにてモデルアクセスの有効化を行ってください。',
    'Add a failover region': 'Failover Region を追加',
    // Application Inference Profiles
    'Enable Application Inference Profiles': 'アプリケーション推論プロファイルを有効にする',
    'Use Application Inference Profiles for cost allocation and tracking': 'コスト配分とトラッキングのためのアプリケーション推論プロファイルを使用',
    // Guardrails
    'Amazon Bedrock Guardrails': 'Amazon Bedrock ガードレール',
    'Enable Guardrails': 'ガードレールを有効にする',
    'When enabled, guardrails will be applied to all model interactions to filter harmful content.':
      '有効にすると、すべてのモデル操作にガードレールが適用され、有害なコンテンツがフィルタリングされます。',
    'Guardrail Identifier': 'ガードレールID',
    'The ID of the guardrail you want to use': '使用するガードレールのID',
    'Guardrail Version': 'ガードレールバージョン',
    'The version of the guardrail (DRAFT or a version number)':
      'ガードレールのバージョン（DRAFTまたはバージョン番号）',
    Trace: 'トレース',
    Enabled: '有効',
    Disabled: '無効'
  }
}
