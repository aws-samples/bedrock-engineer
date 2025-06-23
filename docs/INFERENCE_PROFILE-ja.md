# アプリケーション推論プロファイル（Application Inference Profile）

AWS Bedrockで定義された特定のモデルや推論プロファイルを、ユーザー管理の推論プロファイル（以後、アプリケーション推論プロファイル）としてコピーしてタグ付けができます。このアプリケーション推論プロファイルを使用することで、基盤モデルの実行コストを詳細に追跡・配分することが可能です。

## 📋 前提条件

### AWS CLI環境

- AWS CLI バージョン v2.18.17 以上が必要です
- AWS認証情報が適切に設定されている必要があります

### 必要なIAM権限

アプリケーション推論プロファイルを作成・管理するには、以下のIAM権限が必要です：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:CreateInferenceProfile",
        "bedrock:GetInferenceProfile",
        "bedrock:ListInferenceProfiles",
        "bedrock:DeleteInferenceProfile",
        "bedrock:TagResource",
        "bedrock:UntagResource",
        "bedrock:ListTagsForResource"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🚀 アプリケーション推論プロファイルの作成

### 基本的な作成コマンド

`copyFrom` キーのバリューには、システム定義の推論プロファイルまたはベースモデルのARNを入力します。

```bash
aws bedrock create-inference-profile --region 'ap-northeast-1' \
  --inference-profile-name 'custom-bedrock-profile' \
  --description 'custom-bedrock-profile' \
  --model-source '{"copyFrom": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"}' \
  --tags '[{"key": "CostAllocateTag","value": "custom"}]'
```

### コスト配分タグの活用例

プロジェクトや部門別にコストを管理するためのタグ例：

```bash
# プロジェクト別の管理
aws bedrock create-inference-profile --region 'ap-northeast-1' \
  --inference-profile-name 'project-alpha-claude-sonnet' \
  --description 'Project Alpha - Claude 3.5 Sonnet' \
  --model-source '{"copyFrom": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"}' \
  --tags '[
    {"key": "Project", "value": "Alpha"},
    {"key": "Department", "value": "Engineering"},
    {"key": "CostCenter", "value": "CC-1001"},
    {"key": "Environment", "value": "Production"}
  ]'

# 部門別の管理
aws bedrock create-inference-profile --region 'ap-northeast-1' \
  --inference-profile-name 'marketing-team-claude-haiku' \
  --description 'Marketing Team - Claude 3 Haiku for content generation' \
  --model-source '{"copyFrom": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"}' \
  --tags '[
    {"key": "Department", "value": "Marketing"},
    {"key": "UseCase", "value": "ContentGeneration"},
    {"key": "CostCenter", "value": "CC-2001"}
  ]'
```

### 作成状況の確認

アプリケーション推論プロファイルを確認するには、推論プロファイルのタイプに `APPLICATION` を指定してフィルターします。

```bash
aws bedrock list-inference-profiles --region 'ap-northeast-1' \
  --type-equals 'APPLICATION'
```

特定のプロファイルの詳細情報を取得：

```bash
aws bedrock get-inference-profile --region 'ap-northeast-1' \
  --inference-profile-identifier 'custom-bedrock-profile'
```

## 🖥️ Bedrock Engineer での使用方法

### 設定での有効化

1. **設定画面を開く**

   - メニューから「Settings」を選択

2. **AWS設定セクションで有効化**
   - 「Enable Inference Profiles」チェックボックスをオンにする
   - 設定は自動的に保存されます

### モデル選択での識別方法

アプリケーション推論プロファイルは、通常のモデルと以下の点で区別されます：

- **🧠 アイコン**: 青色の脳回路アイコン（LuBrainCircuit）で表示
- **青いボーダー**: 左側に青色の境界線が表示
- **「Profile」バッジ**: モデル名の右側に青いバッジが表示
- **ツールチップ**: マウスオーバーでARN情報が表示

### モデル一覧での表示例

```
🧠 Custom Bedrock Profile [Profile]
   Application Inference Profile for cost tracking
   ARN: arn:aws:bedrock:ap-northeast-1:123456789012:inference-profile/custom-bedrock-profile
```

## 💰 コスト管理とトラッキング

### AWS Cost Explorerでの確認

作成したタグを使用してコストを分析できます：

1. **AWS Cost Explorer**にアクセス
2. **「Group by」**で「Tag」を選択
3. 設定したタグキー（Project、Department等）でフィルタリング
4. Bedrockサービスのコストを詳細に分析

### 請求アラートの設定

特定のプロジェクトや部門のコストが閾値を超えた場合の通知設定：

```bash
# CloudWatch請求アラーム設定例
aws cloudwatch put-metric-alarm \
  --alarm-name "Project-Alpha-Bedrock-Cost-Alert" \
  --alarm-description "Alert when Project Alpha Bedrock costs exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD Name=ServiceName,Value=AmazonBedrock \
  --evaluation-periods 1
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. 推論プロファイルが作成できない

**症状**: `create-inference-profile` コマンドでエラーが発生

**原因と解決策**:

- IAM権限不足 → 上記の必要なIAM権限を確認
- リージョンミスマッチ → ベースモデルが利用可能なリージョンを使用
- AWS CLI バージョンが古い → v2.18.17以上にアップデート

#### 2. Bedrock Engineer でプロファイルが表示されない

**症状**: UI上でアプリケーション推論プロファイルが表示されない

**解決策**:

1. 設定画面で「Enable Inference Profiles」が有効になっているか確認
2. AWS認証情報が正しく設定されているか確認
3. プロファイルが作成されたリージョンと一致しているか確認
4. アプリケーションを再起動して設定を更新

#### 3. コストが正しく配分されない

**症状**: タグ付けしたがコストが適切に分類されない

**解決策**:

- タグが正しく設定されているか確認: `list-tags-for-resource`
- Cost Explorerでのタグ有効化設定を確認
- 請求データの更新まで24-48時間待機

### ログとデバッグ

Bedrock Engineer でのデバッグ情報：

1. **開発者ツール**を開く（F12キー）
2. **Console**タブで推論プロファイル関連のログを確認
3. エラーメッセージから問題を特定

## 📚 実用的な活用例

### ユースケース別プロファイル設定

```bash
# 開発環境用（コスト重視）
aws bedrock create-inference-profile \
  --inference-profile-name 'dev-claude-haiku' \
  --model-source '{"copyFrom": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"}' \
  --tags '[{"key": "Environment", "value": "Development"}, {"key": "CostOptimized", "value": "true"}]'

# 本番環境用（性能重視）
aws bedrock create-inference-profile \
  --inference-profile-name 'prod-claude-sonnet' \
  --model-source '{"copyFrom": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"}' \
  --tags '[{"key": "Environment", "value": "Production"}, {"key": "HighPerformance", "value": "true"}]'
```

### 定期的なコスト確認スクリプト

```bash
#!/bin/bash
# 月次コストレポートの生成例

echo "=== Monthly Bedrock Cost Report ==="
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE Type=TAG,Key=Project \
  --filter file://bedrock-filter.json
```

## 🔗 参考資料

- [AWS re:Post - Bedrock コスト配分タグの追加方法](https://repost.aws/ja/knowledge-center/bedrock-add-cost-allocation-tags)
- [AWS Bedrock 推論プロファイル公式ドキュメント](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [AWS Cost Explorer ユーザーガイド](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ce-what-is.html)

---

このドキュメントにより、アプリケーション推論プロファイルを効果的に活用してBedrockのコストを管理し、プロジェクトや部門別の詳細な分析が可能になります。
