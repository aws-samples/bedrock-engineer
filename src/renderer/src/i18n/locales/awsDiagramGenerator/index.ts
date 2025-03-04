export const awsDiagramGenerator = {
  en: {
    // Page title and components
    awsDiagramGenerator: 'AWS Diagram Generator',
    generatingRecommendations: 'Generating recommendations...',
    addRecommend: 'Considering additional recommended features',
    awsLibraries: 'AWS Libraries',
    enableAWSCLI: 'AWS',
    awsCliEnabled: 'AWS CLI Enabled',
    awsCliDisabled: 'AWS CLI Disabled',
    analyzingAwsEnvironment: 'Analyzing AWS environment...',

    hide: 'hide',
    showExplanation: 'Show Explanation',

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
    defaultExplanation: `# Diagram Generator

This tool is an AI generator that automatically generates AWS architecture diagrams from natural language descriptions.

In addition to AWS architecture diagrams, it can also represent a variety of diagrams, including software architectures.

## How to use

1. Enter a description of your AWS architecture in the text area at the bottom
2. Example: "Web application with EC2 instances and RDS database"
3. Once submitted, AI will analyze your description and generate an appropriate AWS configuration diagram
4. The generated diagram will be displayed in the Draw.io editor and can be edited as needed

## Features

- **AI-based automatic diagram generation**: Create professional AWS configuration diagrams from natural language descriptions
- **Search function**: Click the "Search" button to obtain the latest AWS service information and generate a diagram
- **AWS CLI integration**: Click the "AWS" button to analyze your current AWS environment using AWS CLI and generate a diagram
- **History management**: Generated diagrams are saved in the history, and you can refer to past diagrams by clicking the numbers at the top
- **Diagram description**: A detailed description of the diagram is displayed in the right panel

## Tips

- Entering a more detailed description will generate a more accurate diagram
- Explicitly stating specific AWS service names will include them in the diagram
- "Search" generates a diagram that reflects the latest AWS service information, but it may take longer to process
- "AWS" button uses AWS CLI to analyze your current AWS environment and generate a diagram based on actual resources

## Constraints

- Currently, the AWS integration function can only investigate the following resources:
- EC2, S3, RDS, Lambda, APIGateway, DynamoDB, ELB`
  },
  ja: {
    // Page title and components
    awsDiagramGenerator: 'AWS ダイアグラムジェネレーター',
    generatingRecommendations: 'レコメンデーションを生成中...',
    addRecommend: '追加機能を検討中',
    awsLibraries: 'AWSライブラリ',
    enableAWSCLI: 'AWS',
    awsCliEnabled: 'AWS CLI 有効',
    awsCliDisabled: 'AWS CLI 無効',
    analyzingAwsEnvironment: 'AWS環境を分析中...',

    hide: '非表示',
    showExplanation: '説明を表示',

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
    defaultExplanation: `# Diagram Generator

このツールは、自然言語の説明からAWSアーキテクチャ図を自動生成するAIジェネレーターです。
AWS のアーキテクチャ図以外にも、ソフトウェアアーキテクチャを含め、様々なダイアグラムが表現できます。

## 使い方

1. 下部のテキストエリアにAWSアーキテクチャの説明を入力します
2. 例: "EC2インスタンスとRDSデータベースを使用したウェブアプリケーション"
3. 送信すると、AIが説明を分析し、適切なAWS構成図を生成します
4. 生成された図はDraw.ioエディタで表示され、必要に応じて編集できます

## 機能

- **AIによる図の自動生成**: 自然言語の説明からプロフェッショナルなAWS構成図を作成
- **検索機能**: 「Search」ボタンをクリックすると、最新のAWSサービス情報を取得して図を生成
- **AWS連携**: 「AWS」ボタンをクリックすると、AWS CLIを使用して現在のAWS環境を分析し、図を生成
- **履歴管理**: 生成した図は履歴に保存され、上部の番号をクリックして過去の図を参照可能
- **図の説明**: 右側のパネルに図の詳細な説明が表示されます

## ヒント

- より詳細な説明を入力すると、より正確な図が生成されます
- 特定のAWSサービス名を明示的に記載すると、それらが図に含まれます
- 「Search」すると最新のAWSサービス情報を反映した図が生成されますが、処理時間が長くなることがあります
- 「AWS」ボタンを使用すると、AWS CLIで現在のAWS環境を分析し、実際のリソースに基づいた図を生成します

## 制約

- 現在 AWS 連携機能では以下のリソースのみを対象として調査することが可能です。
  - EC2, S3, RDS, Lambda, APIGateway, DynamoDB, ELB
    `
  }
}
