export const ja = {
  title: 'Agent Directory',
  description:
    'コントリビューターや組織によって作成されたエージェントを閲覧し、コレクションに追加できます',
  searchAgents: 'エージェントを検索...',

  // Agent Card
  addAgent: '追加する',
  viewDetails: '詳細を見る',

  // Detail Modal
  authorLabel: '作成者',
  systemPromptLabel: 'System Prompt',
  toolsLabel: 'Tools',
  mcpServersLabel: 'MCPサーバー',
  close: '閉じる',
  scenariosLabel: 'Scenario',
  addToMyAgents: 'マイエージェントに追加',
  loading: '読み込み中...',
  agentAddedSuccess: '追加しました',
  agentAddedError: '追加エラー',

  // Loading States
  loadingAgents: 'エージェントを読み込み中...',
  noAgentsFound: 'エージェントが見つかりませんでした',
  retryButton: '再試行',

  // Organization Modal
  organization: {
    editOrganization: '組織を編集',
    addOrganization: '組織を追加',
    deleteOrganization: '組織を削除',
    organizationName: '組織名',
    enterOrganizationName: '組織名を入力してください',
    description: '説明',
    enterDescription: '説明を入力してください',
    organizationSetupDescription:
      '組織のエージェント共有環境を設定します。S3バケットを指定して、チーム内でカスタムエージェントを共有・管理できます。',
    s3Settings: 'S3設定',
    openS3Console: 'S3コンソールを開く ↗',
    s3Bucket: 'S3バケット',
    awsRegion: 'AWSリージョン',
    pathPrefix: 'パスプリフィックス',
    pathPrefixHelper:
      '任意: エージェントをサブディレクトリで整理します（例：「team1/」、「prod/」）',
    saving: '保存中...',
    update: '更新',
    add: '追加',
    cancel: 'キャンセル',
    delete: '削除',
    deleteConfirmTitle: '組織の削除確認',
    deleteConfirmMessage:
      'この組織を削除してもよろしいですか？\n削除すると元に戻すことはできません。',
    deleteSuccess: '組織を削除しました',
    deleteError: '削除中にエラーが発生しました',
    organizationNameRequired: '組織名は必須です',
    s3BucketRequired: 'S3バケットは必須です',
    unknownError: '不明なエラーが発生しました',
    toast: {
      organizationAdded: '「{{name}}」を追加しました',
      organizationUpdated: '「{{name}}」を更新しました',
      organizationDeleted: '「{{name}}」を削除しました',
      organizationError: 'エラーが発生しました: {{error}}'
    }
  },

  // Organization Setup
  organizationSetupDescription:
    '組織のエージェント共有環境を設定します。S3バケットを指定して、チーム内でカスタムエージェントを共有・管理できます。',

  // Contributor Modal
  contributor: {
    tooltip: 'コントリビューターになる',
    title: 'Agent Directory のコントリビューターになる',
    subtitle: 'あなたのカスタムエージェントをコミュニティと共有しましょう',
    steps: 'コントリビュート方法:',
    step1: 'カスタムエージェントを共有ファイルとしてエクスポートする',
    step2: 'YAMLファイルをこのディレクトリに保存する:',
    step3: '作者としてGitHubのユーザー名を追加する（推奨）:',
    step4: 'プルリクエストを送信するか、YAMLファイルを添付してGitHub Issueを開く',
    submitOptions: '送信オプション',
    prOption: 'プルリクエストで送信（開発者向け）',
    prDescription:
      'リポジトリをフォークし、エージェントファイルを追加して、プルリクエストを送信します。',
    viewRepo: 'リポジトリを表示',
    issueOption: 'GitHub Issueで送信（簡単な方法）',
    issueDescription:
      '事前入力されたIssueテンプレートを使用してエージェントを送信します。リポジトリ管理者が YAML ファイルを作成してコードベースに取り込みます。',
    createIssue: 'テンプレートでIssueを作成',
    githubIssue: 'GitHub Issueで送信する',
    copied: 'コピーしました！',
    copy: 'コピー'
  }
}
