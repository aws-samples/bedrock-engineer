# リリース手順ガイド

このドキュメントでは、Bedrock Engineerのリリース方法について説明します。このリリースフローではタグベースのトリガーによるPR自動生成を使用した承認プロセスを実装しています。

## リリース手順 (タグベース)

### 1. **リリースタグの作成とプッシュ**:

```bash
# 最新のmainブランチから開始
git checkout main
git pull

# タグを作成
git tag vX.Y.Z

# タグをプッシュ
git push origin vX.Y.Z
```

### 2. **自動リリース準備プロセス**:

タグがプッシュされると、以下の処理が自動的に実行されます:

1. `tag-based-release.yml` ワークフローが起動します
2. リリースブランチ `release/vX.Y.Z` が自動的に作成されます
3. `package.json` のバージョン番号が自動的に更新されます
4. README.md と README-ja.md のバージョン参照が自動的に更新されます
5. リリースブランチがプッシュされ、`draft-release.yml` ワークフローが自動的に起動します
6. Pull Requestが自動的に作成されます

### 3. **ビルドとドラフトリリース作成の監視**:

- リリースブランチのプッシュにより、GitHub Actionsの`Build Draft Release`ワークフローが自動的に起動します
- GitHub Actionsの進行状況を[Actionsタブ](https://github.com/aws-samples/bedrock-engineer/actions)で確認します
- ワークフローが正常に完了すると、以下の処理が自動的に行われます:
  1. Mac版とWindows版のビルドが実行される
  2. ビルド成果物が添付されたドラフトリリースが作成される

### 4. **リリース確認とPRレビュー**:

- 自動生成されたPRをレビューします
- [Releasesページ](https://github.com/aws-samples/bedrock-engineer/releases)でドラフトリリースにアクセスし、ビルド成果物（.dmg、.pkg、.exe）と内容を確認します
- リリースノートを確認します
- 問題がなければ、PRを承認しマージします

### 5. **リリース公開**:

- PRがマージされると、自動的に`Publish Release`ワークフローが実行され、ドラフトリリースが公開されます
- [Releasesページ](https://github.com/aws-samples/bedrock-engineer/releases)で公開されたリリースを確認できます

## 従来の手動リリースフロー (参考)

以下は従来の手動リリースフローです。タグベースのフローに置き換わりました。

### 1. **バージョンアップ**:

- `package.json`ファイルのバージョン番号を更新します
- README.md, README-ja.md の該当箇所のバージョンを更新します

### 2. **リリースブランチの作成**:

```bash
# リリースブランチを作成
git checkout -b release/vX.Y.Z

# バージョン更新をコミット
git add package.json
git commit -m "chore: バージョンをX.Y.Zに更新"

# リリースブランチをプッシュ
git push origin release/vX.Y.Z
```

### 3. **手動PRの作成**:

```bash
# リリースブランチから作成
gh pr create \
  --title "リリース vX.Y.Z" \
  --body "## リリース vX.Y.Z の準備ができました..." \
  --base main \
  --head release/vX.Y.Z
```

## トラブルシューティング

### ビルドに失敗した場合:

1. GitHub Actionsのログを確認して問題を特定します
2. リリースブランチを修正し、再度プッシュします
3. 問題が解決しない場合は、リリースブランチを削除して最初からやり直すこともできます

### リリースドラフトに問題があり、PRをマージしたくない場合:

1. PRをクローズします（マージせずに）
2. 必要に応じてドラフトリリースを削除:

```bash
gh release delete vX.Y.Z
```

3. 問題を修正し、リリースブランチを更新してプッシュします

### マージ後のリリース公開に失敗した場合:

1. GitHub Actionsのログを確認して問題を特定します
2. 必要に応じて手動でリリースを公開:

```bash
gh release edit vX.Y.Z --draft=false
```

## バージョニング規則

[セマンティックバージョニング](https://semver.org/lang/ja/)に従います：

- **メジャーバージョン (X)**: 互換性のない変更
- **マイナーバージョン (Y)**: 後方互換性のある機能追加
- **パッチバージョン (Z)**: 後方互換性のあるバグ修正
