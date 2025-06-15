export const awsDiagramGenerator = {
  en: {
    // Page title and components
    awsDiagramGenerator: 'AWS Diagram Generator',
    generatingRecommendations: 'Generating recommendations...',
    addRecommend: 'Considering additional recommended features',
    awsLibraries: 'AWS Libraries',

    // Example prompts
    serverlessArchitectureTitle: 'Serverless API',
    serverlessArchitectureValue:
      'Create a serverless architecture with API Gateway, Lambda, and DynamoDB for a RESTful API',
    microservicesTitle: 'Microservices',
    microservicesValue:
      'Design a microservices architecture using ECS, API Gateway, and DynamoDB with service discovery',
    webHostingTitle: 'Website Hosting',
    webHostingValue:
      'Create a scalable web hosting architecture with S3, CloudFront, Route 53, and WAF',
    dataLakeTitle: 'Data Lake',
    dataLakeValue:
      'Design a data lake architecture using S3, Glue, Athena, and QuickSight for analytics',
    containerizedAppTitle: 'Containerized App',
    containerizedAppValue:
      'Create an EKS-based containerized application architecture with load balancing and auto-scaling',
    hybridConnectivityTitle: 'Hybrid Network',
    hybridConnectivityValue:
      'Design a hybrid connectivity architecture between on-premises and AWS using Direct Connect and VPN',

    // New diagram types
    sequenceDiagramTitle: 'Sequence Diagram',
    sequenceDiagramValue:
      'Create a sequence diagram showing the interaction between a user, frontend, API service, and database during a user registration and authentication flow',
    userStoryMapTitle: 'User Story Map',
    userStoryMapValue:
      'Design a user story map for an e-commerce mobile app showing the customer journey from product discovery to purchase completion and order tracking',

    // AWS CDK conversion
    'Convert to AWS CDK': 'Convert to AWS CDK with Agent Chat',
    'AWS architecture detected': 'AWS architecture detected'
  },
  ja: {
    // Page title and components
    awsDiagramGenerator: 'AWS ダイアグラムジェネレーター',
    generatingRecommendations: 'レコメンデーションを生成中...',
    addRecommend: '追加機能を検討中',
    awsLibraries: 'AWSライブラリ',

    // Example prompts
    serverlessArchitectureTitle: 'Serverless API',
    serverlessArchitectureValue:
      'API Gateway、Lambda、DynamoDBを使用したRESTful APIのサーバーレスアーキテクチャを作成する',
    microservicesTitle: 'マイクロサービス',
    microservicesValue:
      'ECS、API Gateway、DynamoDBを使用したサービスディスカバリー付きのマイクロサービスアーキテクチャを設計する',
    webHostingTitle: 'Website Hosting',
    webHostingValue:
      'S3、CloudFront、Route 53、WAFを使用したスケーラブルなWebホスティングアーキテクチャを作成する',
    dataLakeTitle: 'データレイク',
    dataLakeValue:
      'S3、Glue、Athena、QuickSightを使用した分析用のデータレイクアーキテクチャを設計する',
    containerizedAppTitle: 'コンテナアプリ',
    containerizedAppValue:
      'ロードバランシングと自動スケーリングを備えたEKSベースのコンテナ化アプリケーションアーキテクチャを作成する',
    hybridConnectivityTitle: 'ハイブリッドネットワーク',
    hybridConnectivityValue:
      'Direct ConnectとVPNを使用したオンプレミスとAWS間のハイブリッド接続アーキテクチャを設計する',

    // New diagram types
    sequenceDiagramTitle: 'シーケンス図',
    sequenceDiagramValue:
      'ユーザー登録と認証フローにおけるユーザー、フロントエンド、APIサービス、データベース間の相互作用を示すシーケンス図を作成する',
    userStoryMapTitle: 'ユーザーストーリーマップ',
    userStoryMapValue:
      '商品発見から購入完了、注文追跡までの顧客の旅を示すEコマースモバイルアプリのためのユーザーストーリーマップを設計する',

    // AWS CDK conversion
    'Convert to AWS CDK': 'Agent ChatでAWS CDKに変換',
    'AWS architecture detected': 'AWS構成が検出されました'
  }
}
