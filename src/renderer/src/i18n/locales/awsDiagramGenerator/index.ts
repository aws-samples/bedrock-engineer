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

    // Software Architecture prompts
    layeredArchTitle: 'Layered Arch',
    layeredArchValue:
      'Create a layered architecture diagram showing presentation, business, data access, and database layers',
    microservicesArchTitle: 'Microservices',
    microservicesArchValue:
      'Design a microservices architecture with API gateway, service mesh, and database per service',
    databaseDesignTitle: 'Database Design',
    databaseDesignValue:
      'Create an Entity-Relationship diagram for an e-commerce system with users, products, and orders',
    apiDesignTitle: 'API Design',
    apiDesignValue:
      'Design REST API architecture showing endpoints, request/response flow, and authentication',
    eventDrivenTitle: 'Event-Driven',
    eventDrivenValue:
      'Create an event-driven architecture with message queues, event buses, and event handlers',
    cqrsPatternTitle: 'CQRS Pattern',
    cqrsPatternValue:
      'Design CQRS and Event Sourcing architecture with command and query separation',

    // Business Process prompts
    approvalFlowTitle: 'Approval Flow',
    approvalFlowValue:
      'Create an approval workflow diagram for document review and authorization process',
    customerJourneyTitle: 'Customer Journey',
    customerJourneyValue:
      'Design a customer journey map from awareness to purchase and post-sale support',
    orderProcessTitle: 'Order Process',
    orderProcessValue:
      'Create an order processing workflow from order placement to delivery and payment',
    decisionTreeTitle: 'Decision Tree',
    decisionTreeValue: 'Design a decision-making flowchart for customer support issue resolution',
    serviceFlowTitle: 'Service Flow',
    serviceFlowValue: 'Create a service delivery process diagram with stakeholder interactions',
    bpmnDiagramTitle: 'BPMN Diagram',
    bpmnDiagramValue: 'Design a BPMN business process diagram for employee onboarding workflow',

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

    // Software Architecture prompts
    layeredArchTitle: 'レイヤードアーキテクチャ',
    layeredArchValue:
      'プレゼンテーション層、ビジネス層、データアクセス層、データベース層を示すレイヤードアーキテクチャ図を作成する',
    microservicesArchTitle: 'マイクロサービス',
    microservicesArchValue:
      'APIゲートウェイ、サービスメッシュ、サービス毎のデータベースを含むマイクロサービスアーキテクチャを設計する',
    databaseDesignTitle: 'データベース設計',
    databaseDesignValue:
      'ユーザー、商品、注文を含むEコマースシステムのEntity-Relationship図を作成する',
    apiDesignTitle: 'API設計',
    apiDesignValue:
      'エンドポイント、リクエスト/レスポンスフロー、認証を示すREST APIアーキテクチャを設計する',
    eventDrivenTitle: 'イベント駆動',
    eventDrivenValue:
      'メッセージキュー、イベントバス、イベントハンドラーを含むイベント駆動アーキテクチャを作成する',
    cqrsPatternTitle: 'CQRSパターン',
    cqrsPatternValue:
      'コマンドとクエリの分離を特徴とするCQRSとEvent Sourcingアーキテクチャを設計する',

    // Business Process prompts
    approvalFlowTitle: '承認フロー',
    approvalFlowValue: '文書レビューと承認プロセスのための承認ワークフロー図を作成する',
    customerJourneyTitle: 'カスタマージャーニー',
    customerJourneyValue:
      '認知から購入、アフターサポートまでのカスタマージャーニーマップを設計する',
    orderProcessTitle: '注文プロセス',
    orderProcessValue: '注文受付から配送、決済までの注文処理ワークフローを作成する',
    decisionTreeTitle: '意思決定ツリー',
    decisionTreeValue: 'カスタマーサポートの問題解決のための意思決定フローチャートを設計する',
    serviceFlowTitle: 'サービスフロー',
    serviceFlowValue: 'ステークホルダーとの相互作用を含むサービス提供プロセス図を作成する',
    bpmnDiagramTitle: 'BPMN図',
    bpmnDiagramValue: '従業員オンボーディングワークフローのBPMNビジネスプロセス図を設計する',

    // AWS CDK conversion
    'Convert to AWS CDK': 'Agent ChatでAWS CDKに変換',
    'AWS architecture detected': 'AWS構成が検出されました'
  }
}
