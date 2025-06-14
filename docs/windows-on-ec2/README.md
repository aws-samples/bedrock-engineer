# AWS EC2 Windows 開発環境構築ガイド (CloudFormation版)

このディレクトリには、CloudFormationを使用してAWS EC2上にWindows開発環境を素早く構築するためのツールが含まれています。

## 📋 対象環境

- **プラットフォーム**: macOS
- **構築方法**: CloudFormation専用
- **接続方法**: RDP (Microsoft Remote Desktop)

## 📁 ファイル構成

```
docs/windows-on-ec2/
├── README.md                          # このファイル
├── cloudformation-windows-ec2.yaml   # CloudFormationテンプレート
└── deploy-windows-ec2.sh             # macOS用デプロイスクリプト
```

## ⚡ クイックスタート

### 前提条件

- macOS環境
- AWSアカウントとIAM権限
- AWS CLIの設定
- 既存のEC2キーペア
- Microsoft Remote Desktop (App Storeから入手可能)

### 最速デプロイ

```bash
# スクリプトに実行権限を付与
chmod +x docs/deploy-windows-ec2.sh

# デプロイ実行
cd docs
./deploy-windows-ec2.sh --key-name YOUR_KEY_NAME --allowed-cidr YOUR_IP/32
```

### 実行例

```bash
# 現在のIPアドレスを自動検出
./deploy-windows-ec2.sh --key-name my-keypair --allowed-cidr $(curl -s https://checkip.amazonaws.com/)/32

# カスタム設定
./deploy-windows-ec2.sh \
  --key-name my-keypair \
  --allowed-cidr 203.0.113.0/32 \
  --instance-type t3.xlarge \
  --stack-name my-dev-environment
```

## 🏗️ CloudFormationテンプレートの特徴

- **完全自動化**: 一度の実行でインスタンス、セキュリティグループ、IAMロールを作成
- **パラメータ化**: インスタンスタイプ、ボリュームサイズなどをカスタマイズ可能
- **セキュリティ**: 暗号化されたEBSボリューム、最小権限のIAMロール
- **ベストプラクティス**: Elastic IP、適切なタグ付け
- **cfn-lint検証済み**: 品質保証済み

### パラメータ

| パラメータ         | 説明                     | デフォルト             | 必須 |
| ------------------ | ------------------------ | ---------------------- | ---- |
| `KeyName`          | EC2キーペア名            | -                      | ✅   |
| `AllowedCidrBlock` | RDP接続許可CIDR          | `0.0.0.0/0`            | ✅   |
| `InstanceType`     | EC2インスタンスタイプ    | `t3.large`             |      |
| `InstanceName`     | インスタンス名           | `Windows-Dev-Instance` |      |
| `VolumeSize`       | EBSボリュームサイズ (GB) | `30`                   |      |
| `VolumeType`       | EBSボリュームタイプ      | `gp3`                  |      |
| `VpcId`            | VPC ID                   | `''` (デフォルトVPC)   |      |

## 🛠️ デプロイスクリプト

### macOS用スクリプト (deploy-windows-ec2.sh)

**特徴**:

- カラー出力によるわかりやすいログ
- 自動的な現在IPアドレス検出
- ドライランモード
- 変更セット確認機能
- macOS環境に最適化

**オプション**:

```bash
./deploy-windows-ec2.sh [オプション]

必須パラメータ:
  --key-name KEY_NAME         既存のEC2キーペア名
  --allowed-cidr CIDR         RDPアクセスを許可するCIDRブロック

オプション:
  --stack-name NAME           CloudFormationスタック名 (デフォルト: windows-dev-stack)
  --instance-type TYPE        EC2インスタンスタイプ (デフォルト: t3.large)
  --instance-name NAME        インスタンス名 (デフォルト: Windows-Dev-Instance)
  --volume-size SIZE          EBSボリュームサイズ (GB) (デフォルト: 30)
  --volume-type TYPE          EBSボリュームタイプ (デフォルト: gp3)
  --region REGION             AWSリージョン (デフォルト: 現在の設定)
  --dry-run                   ドライラン（実際にはデプロイしない）
  --delete                    スタックを削除
  --help                      ヘルプを表示
```

**使用例**:

```bash
# 基本使用
./deploy-windows-ec2.sh --key-name my-keypair --allowed-cidr 203.0.113.0/32

# 高性能インスタンス
./deploy-windows-ec2.sh \
  --key-name my-keypair \
  --allowed-cidr 203.0.113.0/32 \
  --instance-type t3.2xlarge

# ドライラン
./deploy-windows-ec2.sh --key-name my-keypair --allowed-cidr 203.0.113.0/32 --dry-run

# スタック削除
./deploy-windows-ec2.sh --delete --stack-name windows-dev-stack
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
2. **定期的なパスワード変更**: Administrator パスワードの定期変更
3. **Windows Update**: 定期的なセキュリティ更新の適用
4. **作業終了時の停止**: 使用しない時はインスタンスを停止

## 💰 コスト最適化

### インスタンスタイプの選択

| 用途         | 推奨インスタンス | 月額概算 (us-east-1) |
| ------------ | ---------------- | -------------------- |
| 軽量開発     | t3.medium        | ~$30                 |
| 標準開発     | t3.large         | ~$60                 |
| 重い開発作業 | t3.xlarge        | ~$120                |
| 高性能要求   | t3.2xlarge       | ~$240                |

## 🔧 接続とセットアップ

### 1. Microsoft Remote Desktop の準備

1. App Storeから「Microsoft Remote Desktop」をダウンロード
2. アプリケーションを起動

### 2. RDP接続

1. **管理者パスワードの取得**:

   - EC2コンソールでインスタンスを選択
   - 「アクション」→「セキュリティ」→「Windows パスワードを取得」
   - キーペアファイル（.pem）で復号化

2. **Remote Desktop設定**:

   - 「Add PC」をクリック
   - **PC name**: パブリックIPアドレス
   - **User account**: 「Add User Account」
     - **Username**: `Administrator`
     - **Password**: 復号化したパスワード
   - 「Save」をクリック

3. **接続実行**:
   - 作成したPC設定をダブルクリック
   - 証明書警告が表示された場合は「Continue」
