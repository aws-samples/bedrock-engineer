# AWS EC2 Ubuntu 開発環境構築ガイド (CloudFormation版)

このディレクトリには、CloudFormationを使用してAWS EC2上にUbuntu開発環境を素早く構築するためのツールが含まれています。

## 📋 対象環境

- **プラットフォーム**: Ubuntu 22.04 LTS
- **構築方法**: CloudFormation専用
- **接続方法**: SSH (OpenSSH)
- **開発ツール**: Node.js, Python, Docker, Git, AWS CLI, Bedrock SDK

## 📁 ファイル構成

```
docs/ubuntu-on-ec2/
├── README.md                      # このファイル
├── cloudformation-ubuntu-ec2.yaml # CloudFormationテンプレート
└── deploy-ubuntu-ec2.sh          # Linux/macOS用デプロイスクリプト
```

## ⚡ クイックスタート

### 前提条件

- Linux/macOS環境
- AWSアカウントとIAM権限
- AWS CLIの設定
- 既存のEC2キーペア
- SSH クライアント

### 最速デプロイ

```bash
# スクリプトに実行権限を付与
chmod +x docs/ubuntu-on-ec2/deploy-ubuntu-ec2.sh

# デプロイ実行
cd docs/ubuntu-on-ec2
./deploy-ubuntu-ec2.sh --key-name YOUR_KEY_NAME --allowed-cidr YOUR_IP/32
```

### 実行例

```bash
# 現在のIPアドレスを自動検出
./deploy-ubuntu-ec2.sh --key-name my-keypair --allowed-cidr $(curl -s https://checkip.amazonaws.com/)/32

# カスタム設定
./deploy-ubuntu-ec2.sh \
  --key-name my-keypair \
  --allowed-cidr 203.0.113.0/32 \
  --instance-type t3.large \
  --stack-name my-ubuntu-dev

# 高性能インスタンス
./deploy-ubuntu-ec2.sh \
  --key-name my-keypair \
  --allowed-cidr $(curl -s https://checkip.amazonaws.com/)/32 \
  --instance-type t3.xlarge \
  --volume-size 50
```

## 🏗️ CloudFormationテンプレートの特徴

- **完全自動化**: 一度の実行でインスタンス、セキュリティグループ、IAMロールを作成
- **開発ツール自動インストール**: Git, Node.js, Python, Docker, AWS CLI, VS Code Server
- **Bedrock統合**: Amazon Bedrock へのフルアクセス権限
- **セキュリティ**: 暗号化されたEBSボリューム、最小権限のIAMロール
- **パフォーマンス**: 最新のEC2インスタンスタイプとgp3ストレージ

### パラメータ

| パラメータ         | 説明                         | デフォルト               | 必須 |
| ------------------ | ---------------------------- | ------------------------ | ---- |
| `KeyName`          | EC2キーペア名                | -                        | ✅   |
| `AllowedCidrBlock` | SSH接続許可CIDR              | `0.0.0.0/0`              | ✅   |
| `InstanceType`     | EC2インスタンスタイプ        | `t3.medium`              |      |
| `InstanceName`     | インスタンス名               | `Ubuntu-Dev-Instance`    |      |
| `VolumeSize`       | EBSボリュームサイズ (GB)     | `20`                     |      |
| `VolumeType`       | EBSボリュームタイプ          | `gp3`                    |      |
| `VpcId`            | VPC ID                       | `''` (デフォルトVPC)     |      |

## 🛠️ プリインストールされる開発ツール

### システムツール
- **Git**: 最新版
- **curl, wget**: ネットワークツール
- **build-essential**: C/C++コンパイラ
- **vim, nano**: テキストエディタ

### 開発環境
- **Node.js**: LTS版 (nvm経由)
- **npm, yarn**: パッケージマネージャ
- **Python 3**: pip3付き
- **Docker**: Docker Engine + Docker Compose
- **AWS CLI v2**: 最新版

### Bedrock開発ツール
- **boto3**: AWS SDK for Python
- **anthropic**: Anthropic SDK
- **langchain**: LangChain フレームワーク

### オプションツール
- **VS Code Server**: リモート開発環境
- **Oh My Zsh**: シェル環境の改善

## 🛠️ デプロイスクリプト

### Linux/macOS用スクリプト (deploy-ubuntu-ec2.sh)

**特徴**:

- カラー出力によるわかりやすいログ
- 自動的な現在IPアドレス検出
- ドライランモード
- 変更セット確認機能
- Linux/macOS環境に最適化

**オプション**:

```bash
./deploy-ubuntu-ec2.sh [オプション]

必須パラメータ:
  --key-name KEY_NAME         既存のEC2キーペア名
  --allowed-cidr CIDR         SSHアクセスを許可するCIDRブロック

オプション:
  --stack-name NAME           CloudFormationスタック名 (デフォルト: ubuntu-dev-stack)
  --instance-type TYPE        EC2インスタンスタイプ (デフォルト: t3.medium)
  --instance-name NAME        インスタンス名 (デフォルト: Ubuntu-Dev-Instance)
  --volume-size SIZE          EBSボリュームサイズ (GB) (デフォルト: 20)
  --volume-type TYPE          EBSボリュームタイプ (デフォルト: gp3)
  --region REGION             AWSリージョン (デフォルト: 現在の設定)
  --dry-run                   ドライラン（実際にはデプロイしない）
  --delete                    スタックを削除
  --help                      ヘルプを表示
```

## 🔐 セキュリティ考慮事項

### IP制限の重要性

```bash
# ✅ 推奨: 特定のIPアドレスのみ許可
--allowed-cidr 203.0.113.0/32

# ❌ 非推奨: 全世界に開放
--allowed-cidr 0.0.0.0/0
```

### セキュリティベストプラクティス

1. **最小権限の原則**: 必要最小限のCIDRブロックを指定
2. **定期的なキー管理**: SSH キーペアの定期的な更新
3. **システム更新**: 定期的なパッケージ更新の適用
4. **作業終了時の停止**: 使用しない時はインスタンスを停止

## 💰 コスト最適化

### インスタンスタイプの選択

| 用途           | 推奨インスタンス | 月額概算 (us-east-1) |
| -------------- | ---------------- | -------------------- |
| 軽量開発       | t3.micro         | ~$8                  |
| 標準開発       | t3.medium        | ~$30                 |
| 重い開発作業   | t3.large         | ~$60                 |
| Docker/マルチ  | t3.xlarge        | ~$120                |

### コスト削減のヒント

- **スポットインスタンス**: 70%のコスト削減
- **自動停止**: 夜間・週末の自動停止設定
- **Reserved Instances**: 長期利用での割引

## 🔧 接続とセットアップ

### 1. SSH接続

```bash
# パブリックIPアドレス取得
aws cloudformation describe-stacks \
  --stack-name ubuntu-dev-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`PublicIpAddress`].OutputValue' \
  --output text

# SSH接続
ssh -i ~/.ssh/your-keypair.pem ubuntu@PUBLIC_IP_ADDRESS
```

### 2. 初期セットアップ確認

```bash
# 開発ツールの確認
node --version
python3 --version
docker --version
aws --version

# Bedrockアクセステスト
aws bedrock list-foundation-models --region us-east-1

# UserDataログ確認
sudo tail -f /var/log/cloud-init-output.log
```

## 🤖 Bedrock開発環境

### Python例

```python
import boto3

# Bedrockクライアント作成
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# Claude-3 Haikuでテスト
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-haiku-20240307-v1:0',
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "messages": [
            {
                "role": "user", 
                "content": "Hello, Bedrock!"
            }
        ]
    })
)
```

### Node.js例

```javascript
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({ region: "us-east-1" });

const command = new InvokeModelCommand({
  modelId: "anthropic.claude-3-haiku-20240307-v1:0",
  body: JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: [{ role: "user", content: "Hello, Bedrock!" }]
  })
});

const response = await client.send(command);
```

## 🔄 開発ワークフロー

### 1. プロジェクトセットアップ

```bash
# プロジェクトディレクトリ作成
mkdir ~/my-bedrock-project
cd ~/my-bedrock-project

# Git初期化
git init
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 仮想環境（Python）
python3 -m venv venv
source venv/bin/activate
pip install boto3 anthropic langchain
```

### 2. VS Code Server（オプション）

```bash
# VS Code Serverインストール（UserDataで自動実行）
curl -fsSL https://code-server.dev/install.sh | sh

# サービス開始
sudo systemctl enable --now code-server@ubuntu

# ブラウザでアクセス: http://PUBLIC_IP:8080
# パスワードは ~/.config/code-server/config.yaml で確認
```

## 🚀 高度な使用例

### Docker Compose でBedrock開発環境

```yaml
# docker-compose.yml
version: '3.8'
services:
  bedrock-dev:
    image: python:3.11-slim
    volumes:
      - ./src:/app
    working_dir: /app
    environment:
      - AWS_DEFAULT_REGION=us-east-1
    command: tail -f /dev/null
```

### 自動デプロイ（GitHub Actions連携）

```yaml
# .github/workflows/deploy.yml
name: Deploy to EC2
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to EC2
        run: |
          ssh -i key.pem ubuntu@$EC2_IP 'cd ~/project && git pull && npm install'
```

## 🔍 トラブルシューティング

### よくある問題

1. **SSH接続できない**
   - セキュリティグループの確認
   - キーペアファイルの権限 (`chmod 400`)
   - パブリックIPアドレスの確認

2. **Bedrockアクセスできない**
   - IAMロールの権限確認
   - リージョン設定の確認
   - モデルアクセス権限の確認

3. **インスタンス作成失敗**
   - キーペアの存在確認
   - インスタンス制限の確認
   - VPC/サブネット設定の確認

### ログ確認

```bash
# システムログ
sudo journalctl -u cloud-init-local.service
sudo journalctl -u cloud-init.service

# UserDataログ
sudo cat /var/log/cloud-init-output.log

# Docker ログ
sudo journalctl -u docker.service
```

## 📚 参考資料

- [Amazon Bedrock Developer Guide](https://docs.aws.amazon.com/bedrock/)
- [AWS CloudFormation User Guide](https://docs.aws.amazon.com/cloudformation/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 コントリビューション

改善提案やバグ報告は、GitHubのIssuesでお知らせください。

## 📄 ライセンス

このプロジェクトはMIT-0ライセンスの下で公開されています。