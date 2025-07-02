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

## 🔗 参考資料

- [AWS re:Post - Bedrock コスト配分タグの追加方法](https://repost.aws/ja/knowledge-center/bedrock-add-cost-allocation-tags)
- [AWS Bedrock 推論プロファイル公式ドキュメント](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [AWS Cost Explorer ユーザーガイド](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ce-what-is.html)

---

このドキュメントにより、アプリケーション推論プロファイルを効果的に活用してBedrockのコストを管理し、プロジェクトや部門別の詳細な分析が可能になります。
