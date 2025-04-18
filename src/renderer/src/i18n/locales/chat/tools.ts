export const tools = {
  en: {
    'Available Tools': 'Available Tools',
    'Choose the tools': 'Choose the tools you want to enable for the AI assistant',
    // Common UI text
    'Tool Details': 'Tool Details',
    Example: 'Example',
    Tip: 'Tip',
    'Select a tool from the list': 'Select a tool from the list',
    'Click on any tool to view details and configuration options':
      'Click on any tool to view details and configuration options',
    // MCP Tool related
    'MCP tool from Model Context Protocol server': 'MCP tool from Model Context Protocol server',
    'MCP tools available from configured servers': 'MCP tools available from configured servers',
    From: 'From',
    'MCP servers are configured, but no tools are available. Make sure MCP servers are running and providing tools.':
      'MCP servers are configured, but no tools are available. Make sure MCP servers are running and providing tools.',
    'No MCP servers configured for this agent. Configure MCP servers in the MCP Servers tab to use MCP tools.':
      'No MCP servers configured for this agent. Configure MCP servers in the MCP Servers tab to use MCP tools.',
    'Configured MCP Servers': 'Configured MCP Servers',
    Information: 'Information',
    Warning: 'Warning',
    // Tavily Search Settings
    'Tavily Search API Settings': 'Tavily Search API Settings',
    'About Tavily Search': 'About Tavily Search',
    'You need a Tavily Search API key to use this feature. Get your API key at':
      'You need a Tavily Search API key to use this feature. Get your API key at',
    'Tavily Search allows the AI assistant to search the web for current information, providing better responses to queries about recent events, technical documentation, or other information that may not be in its training data.':
      'Tavily Search allows the AI assistant to search the web for current information, providing better responses to queries about recent events, technical documentation, or other information that may not be in its training data.',
    Save: 'Save',
    Cancel: 'Cancel',
    'Agent ID': 'Agent ID',
    'Alias ID': 'Alias ID',
    'Command Shell': 'Command Shell',
    'Command Shell Settings': 'Command Shell Settings',
    'Command Pattern': 'Command Pattern',
    'Add Command': 'Add Command',
    'Allowed Command Patterns': 'Allowed Command Patterns',
    'No command patterns registered yet': 'No command patterns registered yet',
    'Select which shell to use when executing commands':
      'Select which shell to use when executing commands',
    'Add New Command Pattern': 'Add New Command Pattern',
    'Use * as a wildcard (e.g., "npm *" allows all npm commands)':
      'Use * as a wildcard (e.g., "npm *" allows all npm commands)',
    Description: 'Description',
    'Add Knowledge Base': 'Add Knowledge Base',
    'Knowledge Base ID': 'Knowledge Base ID',
    'Registered Knowledge Bases': 'Registered Knowledge Bases',
    'No knowledge bases registered yet': 'No knowledge bases registered yet',
    // ツールカテゴリ
    'Tool Categories': {
      'File System': 'File System',
      'Web & Search': 'Web & Search',
      'AI Services': 'AI Services',
      System: 'System',
      'File System Description': 'Tools for managing files and directories',
      'Web & Search Description': 'Tools for interacting with web resources',
      'AI Services Description': 'Tools that utilize AWS AI services',
      'System Description': 'Tools for system interaction'
    },
    'tool descriptions': {
      createFolder: 'Create new directories in your project',
      writeToFile: 'Write or update file contents',
      readFile: 'Read contents from a file',
      readFiles: 'Read contents from multiple files',
      listFiles: 'View directory structure',
      moveFile: 'Move files between locations',
      copyFile: 'Create file duplicates',
      tavilySearch: 'Search the web for information',
      fetchWebsite: 'Fetch and analyze content from websites',
      generateImage: 'Generate images using LLMs',
      recognizeImage: 'Analyze and describe image content using LLM vision capabilities',
      retrieve:
        'Query the Amazon Bedrock Knowledge Base to find relevant information using Retrieval-Augmented Generation (RAG).',
      invokeBedrockAgent: 'Invoke Amazon Bedrock Agent to interact with LLMs and external tools',
      executeCommand: 'Execute allowed commands with support for wildcards',
      applyDiffEdit: 'Apply partial updates to existing files with granular control',
      think: 'Enable AI to perform complex step-by-step reasoning'
    },
    'tool info': {
      retrieve: {
        description:
          'The retrieve tool allows the AI assistant to search and retrieve information from your Amazon Bedrock Knowledge Bases.',
        'about title': 'About Knowledge Bases',
        'about description':
          'Amazon Bedrock Knowledge Bases lets you connect your enterprise data with foundation models, allowing the AI to provide answers based on your own documents and information sources.'
      },
      invokeBedrockAgent: {
        description:
          'The invokeBedrockAgent tool allows the AI assistant to interact with your custom Amazon Bedrock Agents to perform specialized tasks.',
        'about title': 'About Bedrock Agents',
        'about description':
          'Amazon Bedrock Agents let you build AI agents that can retrieve information from your data sources, reason over the data, and take actions to complete tasks. Agents can connect to your systems and APIs to perform actions like booking travel, processing orders, or querying databases.'
      },
      tavilySearch: {
        description:
          'Tavily Search enables the AI assistant to search the web for current information, providing better responses to queries about recent events, technical documentation, or other information that may not be in its training data.',
        'about title': 'About Tavily Search API',
        'about description':
          'Tavily provides an AI search API specifically optimized for LLMs, allowing agents to search the web for up-to-date information. The API returns relevant information from across the web that your AI assistant can use to enhance its responses.'
      },
      executeCommand: {
        description:
          'The executeCommand tool allows the AI assistant to run system commands on your local machine. This is powerful but requires careful configuration for security.',
        'warning title': 'Security Considerations',
        'warning description':
          'Only allow specific command patterns that you trust. Use wildcards carefully (e.g., "ls *" to allow listing directories). Never allow unrestricted command execution as this could pose security risks to your system.',
        'example title': 'Example Usage',
        'example description':
          'Common useful patterns include "ls *" (list directories), "npm *" (run npm commands), "aws *" (AWS CLI commands), or "curl *" (make HTTP requests). The AI will only be allowed to run commands that match these patterns.'
      }
    },
    'tool usage': {
      think: {
        description:
          'Enables the AI to perform complex reasoning steps without consuming your context window. This tool allows Claude to work through difficult problems step by step, showing its thought process and reasoning in detail.',
        tip: 'Enable this when you need the AI to solve complex problems, debug difficult issues, or provide detailed explanations of its reasoning process. Only available with Claude 3.7 Sonnet.'
      },
      recognizeImage: {
        description:
          'Enables the AI to analyze and describe images. Perfect for understanding visual content, extracting text from images, or identifying objects and scenes in photographs.',
        tip: 'Use this when you need to work with image content or want the AI to provide detailed descriptions of visual information. Supports common image formats like JPEG, PNG, GIF, and WebP.'
      },
      createFolder: {
        description:
          'Enables the AI to set up project structures automatically. Perfect for starting new projects, creating template directories, or organizing your workspace without manual folder creation.',
        tip: 'Use this when you want the AI to create standardized project structures or scaffold applications.'
      },
      writeToFile: {
        description:
          'Allows the AI to generate and save code, documentation, or any text content directly to files. Ideal for code generation, configuration setup, and documentation tasks.',
        tip: 'Enable this when you need the AI to create or update files with generated content. Great for initializing projects, creating boilerplate code, or writing documentation.'
      },
      readFiles: {
        description:
          'Gives the AI the ability to analyze your project files. Essential for code review, debugging, understanding existing codebases, or getting help with complex file structures.',
        tip: 'Enable this tool when you want the AI to understand your existing code or documents to provide contextual assistance or suggestions for improvements.'
      },
      listFiles: {
        description:
          'Helps the AI understand your project structure by seeing all files and directories. Perfect for project analysis, dependency mapping, or getting a high-level overview of complex projects.',
        tip: 'Use this when you want the AI to help with project organization, architecture review, or understanding complex directory structures without showing specific file contents. When implementing file-based processing with most AI agents (except coding agents), it is recommended to have the agent run this listFiles tool first.'
      },
      moveFile: {
        description:
          'Enables the AI to reorganize your project files. Ideal for code refactoring, project restructuring, or file organization tasks that would otherwise require manual file moving.',
        tip: 'Enable this when you need help restructuring projects or implementing architectural changes that require moving files between directories.'
      },
      copyFile: {
        description:
          'Lets the AI duplicate existing files. Useful for creating backups before edits, generating template variations, or setting up test fixtures based on existing files.',
        tip: 'Use this when you want the AI to make safe copies before risky changes or to duplicate configuration files with minor variations.'
      },
      applyDiffEdit: {
        description:
          'Allows the AI to make precise changes to specific parts of files without affecting the rest. Perfect for targeted code changes, refactoring, or adding features to existing code.',
        tip: 'Enable this for precise code edits, refactoring operations, or when you want to make minimal changes to working code. Safer than full file replacements and helps save tokens.'
      },
      tavilySearch: {
        description:
          'Enables the AI to search the web for current information. Essential for research tasks, troubleshooting with up-to-date solutions, or gathering information about recent developments.',
        tip: 'Use this when you need the AI to incorporate the latest information in its responses or validate information against current sources. Especially valuable for technical questions.'
      },
      fetchWebsite: {
        description:
          'Allows the AI to retrieve and analyze specific web content. Perfect for extracting data from websites, analyzing documentation, or working with online resources as part of your workflow.',
        tip: 'Enable this when you need the AI to work with specific online resources, documentation sites, or web-based data that would be valuable for your current task.'
      },
      generateImage: {
        description:
          'Lets the AI create custom images based on your descriptions. Ideal for design mockups, UI elements, conceptual illustrations, storyboards, product images, marketing content, or visualizing ideas without needing design skills. Available models include Stability AI and Amazon Titan image generators.',
        tip: 'Use this when you need visual elements for your project, want to quickly prototype UI designs, or need to visualize concepts before implementation.'
      },
      retrieve: {
        description:
          "Allows the AI to tap into your organization's knowledge bases. Essential for accessing company-specific information, documentation, or specialized knowledge that isn't widely available online. Requires data to be pre-stored in the Knowledge Base.",
        tip: 'Enable this to give the AI access to your specialized knowledge bases, company documentation, or domain-specific information to get more relevant, context-aware responses.'
      },
      invokeBedrockAgent: {
        description:
          'Connects the AI with specialized Bedrock Agents to perform complex tasks like data analysis, code interpretation, or domain-specific operations beyond normal chat capabilities. Requires agents to be pre-configured in Amazon Bedrock.',
        tip: 'Use this when you need specialized capabilities like code execution, data analysis, or domain-specific knowledge that requires a dedicated agent with specific tools.'
      },
      executeCommand: {
        description:
          'Lets the AI run system commands to automate development tasks. Perfect for build operations, testing, deployment tasks, or any workflow that would typically require command line usage.',
        tip: 'Enable this when you want the AI to help with DevOps tasks, run tests, build projects, or automate repetitive command-line operations. Only pre-approved command patterns are permitted.'
      }
    }
  },
  ja: {
    'Available Tools': '利用可能なツール',
    'Choose the tools': 'AIアシスタントで使用するツールを選択してください',
    // Common UI text
    'Tool Details': 'ツールの詳細',
    Example: '使用例',
    Tip: 'ヒント',
    'Select a tool from the list': 'リストからツールを選択してください',
    'Click on any tool to view details and configuration options':
      'ツールをクリックすると詳細と設定オプションが表示されます',
    // MCP Tool related
    'MCP tool from Model Context Protocol server': 'Model Context Protocol サーバーからのMCPツール',
    'MCP tools available from configured servers': '設定済みサーバーからのMCPツールが利用可能',
    From: '提供元',
    'MCP servers are configured, but no tools are available. Make sure MCP servers are running and providing tools.':
      'MCPサーバーは設定されていますが、利用可能なツールがありません。MCPサーバーが実行中で、ツールを提供していることを確認してください。',
    'No MCP servers configured for this agent. Configure MCP servers in the MCP Servers tab to use MCP tools.':
      'このエージェントにはMCPサーバーが設定されていません。MCPツールを使用するには、MCPサーバータブでMCPサーバーを設定してください。',
    'Configured MCP Servers': '設定済みMCPサーバー',
    Information: '情報',
    Warning: '警告',
    'Global Settings': 'グローバル設定',
    'Agent Specific Settings': 'エージェント固有設定',
    'Global tool settings will be used as default for all agents':
      'グローバルツール設定はすべてのエージェントのデフォルトとして使用されます',
    'specific tool settings': '固有のツール設定',
    'Select an agent first to edit agent-specific settings':
      'エージェント固有の設定を編集するには、まずエージェントを選択してください',
    'Using Global Tool Settings': 'グローバルツール設定を使用中',
    'This agent will use the global tool settings. To customize tools for this agent specifically, select "Agent Specific Settings" above.':
      'このエージェントはグローバルツール設定を使用します。このエージェント固有のツールをカスタマイズするには、上の「エージェント固有設定」を選択してください。',
    // Tavily Search Settings
    'Tavily Search API Settings': 'Tavily Search API設定',
    'About Tavily Search': 'Tavily Searchについて',
    'You need a Tavily Search API key to use this feature. Get your API key at':
      'この機能を使用するにはTavily Search APIキーが必要です。APIキーの取得は',
    'Tavily Search allows the AI assistant to search the web for current information, providing better responses to queries about recent events, technical documentation, or other information that may not be in its training data.':
      'Tavily SearchはAIアシスタントがWeb上の最新情報を検索できるようにし、最近のイベント、技術文書、またはトレーニングデータに含まれていない可能性のある情報に関する質問に対して、より良い回答を提供します。',
    Save: '保存',
    Cancel: 'キャンセル',
    'Agent ID': 'エージェントID',
    'Alias ID': 'エイリアスID',
    'Command Shell': 'コマンドシェル',
    'Command Shell Settings': 'コマンドシェル設定',
    'Command Pattern': 'コマンドパターン',
    'Add Command': 'コマンド追加',
    'Allowed Command Patterns': '許可されたコマンドパターン',
    'No command patterns registered yet': 'コマンドパターンが登録されていません',
    'Select which shell to use when executing commands':
      'コマンド実行時に使用するシェルを選択してください',
    'Add New Command Pattern': '新しいコマンドパターンを追加',
    'Use * as a wildcard (e.g., "npm *" allows all npm commands)':
      '* をワイルドカードとして使用します（例：「npm *」はすべてのnpmコマンドを許可）',
    Description: '説明',
    'Add Knowledge Base': 'ナレッジベース追加',
    'Knowledge Base ID': 'ナレッジベースID',
    'Registered Knowledge Bases': '登録済みナレッジベース',
    'No knowledge bases registered yet': 'ナレッジベースが登録されていません',
    // ツールカテゴリ
    'Tool Categories': {
      'File System': 'ファイルシステム',
      'Web & Search': 'ウェブ＆検索',
      'AI Services': 'AIサービス',
      System: 'システム',
      Thinking: '思考',
      'File System Description': 'ファイルやディレクトリを管理するツール',
      'Web & Search Description': 'ウェブリソースを操作するツール',
      'AI Services Description': 'AWS AIサービスを利用するツール',
      'System Description': 'システムと連携するツール',
      'Thinking Description': '拡張された推論と複雑な問題解決のためのツール'
    },
    'tool descriptions': {
      createFolder: 'プロジェクトに新しいディレクトリを作成',
      writeToFile: 'ファイルの内容を作成または更新',
      readFile: 'ファイルの内容を読み取り',
      readFiles: '複数ファイルの内容を読み取り',
      listFiles: 'ディレクトリ構造を表示',
      moveFile: 'ファイルを別の場所に移動',
      copyFile: 'ファイルの複製を作成',
      tavilySearch: 'Web上の情報を検索',
      fetchWebsite: 'Webサイトのコンテンツを取得して分析',
      generateImage: 'LLMを使用して画像を生成',
      recognizeImage: 'LLMの視覚機能を使用して画像を分析・説明',
      retrieve: 'Amazon Bedrock Knowledge Base へのクエリ',
      invokeBedrockAgent: 'Amazon Bedrock Agent を実行',
      executeCommand: 'ワイルドカードをサポートする許可されたコマンドを実行',
      applyDiffEdit: 'ファイルに対して部分的な更新を適用',
      think: 'AIが複雑なステップバイステップの思考を実行'
    },
    'tool info': {
      retrieve: {
        description:
          'retrieve ツールを使用すると、AIアシスタントはAmazon Bedrock Knowledge Basesから情報を検索して取得できます。',
        'about title': 'ナレッジベースについて',
        'about description':
          'Amazon Bedrock Knowledge Basesを使用すると、企業データを基盤モデルに接続し、AIが独自のドキュメントや情報源に基づいた回答を提供できるようになります。'
      },
      invokeBedrockAgent: {
        description:
          'invokeBedrockAgent ツールを使用すると、AIアシスタントはカスタムAmazon Bedrock Agentと連携して、専門的なタスクを実行できます。',
        'about title': 'Bedrock Agentsについて',
        'about description':
          'Amazon Bedrock Agentsを使用すると、データソースから情報を取得し、データを処理し、タスクを完了するためのアクションを実行するAIエージェントを構築できます。エージェントはシステムやAPIに接続して、旅行の予約、注文の処理、データベースのクエリなどのアクションを実行できます。'
      },
      tavilySearch: {
        description:
          'Tavily SearchはAIアシスタントがWeb上の最新情報を検索できるようにし、最近のイベント、技術文書、またはトレーニングデータに含まれていない可能性のある情報に関する質問に対して、より良い回答を提供します。',
        'about title': 'Tavily Search APIについて',
        'about description':
          'TavilyはLLM向けに特化したAI検索APIを提供しており、エージェントが最新情報をWeb上で検索できるようにします。このAPIはWeb全体から関連情報を返し、AIアシスタントはその情報を利用して回答の質を向上させることができます。'
      },
      executeCommand: {
        description:
          'executeCommand ツールを使用すると、AIアシスタントがローカルマシンでシステムコマンドを実行できるようになります。これは強力な機能ですが、セキュリティのための注意深い設定が必要です。',
        'warning title': 'セキュリティ面での配慮',
        'warning description':
          '信頼できる特定のコマンドパターンのみを許可してください。ワイルドカードは慎重に使用してください（例：ディレクトリ一覧表示を許可するための「ls *」）。無制限のコマンド実行を許可すると、システムにセキュリティリスクが生じる可能性があります。',
        'example title': '使用例',
        'example description':
          '一般的に役立つパターンには「ls *」（ディレクトリ一覧表示）、「npm *」（npmコマンド実行）、「aws *」（AWS CLIコマンド）、「curl *」（HTTPリクエスト作成）などがあります。AIはこれらのパターンにマッチするコマンドのみを実行できます。'
      }
    },
    'tool usage': {
      think: {
        description:
          'AIがコンテキストウィンドウを消費せずに複雑な推論ステップを実行できるようにします。このツールを使用すると、Claudeは難しい問題をステップバイステップで解決し、その思考プロセスと推論を詳細に示すことができます。',
        tip: 'AIに複雑な問題の解決、難しい問題のデバッグ、または推論プロセスの詳細な説明を提供してもらいたい場合に有効にしてください。Claude 3.7 Sonnetでのみ利用可能です。'
      },
      recognizeImage: {
        description:
          'AIが画像を分析して説明できるようにします。視覚的なコンテンツの理解、画像からのテキスト抽出、写真内のオブジェクトやシーンの識別に最適です。',
        tip: '画像コンテンツを扱う必要がある場合や、AIに視覚的情報の詳細な説明を提供してもらいたい場合に使用します。JPEG、PNG、GIF、WebPなどの一般的な画像形式をサポートしています。'
      },
      createFolder: {
        description:
          'AIが自動的にプロジェクト構造をセットアップできるようにします。新規プロジェクトの開始、テンプレートディレクトリの作成、手動でフォルダを作成することなくワークスペースを整理するのに最適です。',
        tip: '標準化されたプロジェクト構造の作成やアプリケーションのスキャフォールディングをAIに行わせたい場合に有効にしてください。'
      },
      writeToFile: {
        description:
          'AIがコード、ドキュメント、またはテキストコンテンツを生成してファイルに直接保存できるようにします。コード生成、設定ファイルのセットアップ、ドキュメント作成タスクに理想的です。',
        tip: 'AIに生成したコンテンツでファイルを作成または更新させたい場合に有効にしてください。プロジェクトの初期化、ボイラープレートコードの作成、ドキュメント作成などに最適です。'
      },
      readFiles: {
        description:
          'AIがプロジェクトファイルを分析できるようにします。コードレビュー、デバッグ、既存のコードベースの理解、複雑なファイル構造の解析に不可欠です。',
        tip: 'AIに既存のコードやドキュメントを理解させ、文脈に沿ったアシスタンスや改善提案を得たい場合にこのツールを有効にしてください。'
      },
      listFiles: {
        description:
          'AIがすべてのファイルとディレクトリを見ることでプロジェクト構造を理解できるようにします。プロジェクト分析、依存関係のマッピング、複雑なプロジェクトの概要把握に最適です。',
        tip: 'AIにプロジェクトの整理、アーキテクチャレビュー、または特定のファイル内容を表示せずに複雑なディレクトリ構造を理解させたい場合に使用します。コーディングエージェント以外のほとんどのAIエージェントの実装においてファイルベースな処理を行う場合はまず最初にこの listFiles ツールを実行させることを推奨します。'
      },
      moveFile: {
        description:
          'AIにプロジェクトファイルの再編成を可能にします。コードリファクタリング、プロジェクトの再構築、手動でのファイル移動が必要な作業の自動化に最適です。',
        tip: 'プロジェクトの再構築やディレクトリ間でファイルを移動する必要のあるアーキテクチャ変更の実装を支援してもらいたい場合に有効にしてください。'
      },
      copyFile: {
        description:
          'AIに既存ファイルの複製を作成させることができます。編集前のバックアップ作成、テンプレートバリエーションの生成、既存ファイルに基づくテストフィクスチャの設定に役立ちます。',
        tip: 'リスクの高い変更前にAIにバックアップを作成させたい場合や、設定ファイルを微妙に変更してバリエーションを作りたい場合に使用します。'
      },
      applyDiffEdit: {
        description:
          'AIがファイルの他の部分に影響を与えることなく、特定の部分に正確な変更を加えることを可能にします。ピンポイントのコード変更、リファクタリング、既存コードへの機能追加に最適です。',
        tip: '精密なコード編集、リファクタリング作業、または動作中のコードに最小限の変更を加えたい場合に有効にしてください。ファイル全体の置き換えよりも安全でトークン数を節約する効果があります。'
      },
      tavilySearch: {
        description:
          'AIがWeb上で最新情報を検索できるようにします。調査タスク、最新の解決策によるトラブルシューティング、最新の開発動向に関する情報収集に不可欠です。',
        tip: 'AIにレスポンスに最新情報を取り入れさせたい場合や、情報を最新の情報源で検証する必要がある場合に使用します。特に技術的な質問に対して価値があります。'
      },
      fetchWebsite: {
        description:
          'AIが特定のWeb上のコンテンツを取得・分析できるようにします。ウェブサイトからのデータ抽出、ドキュメントの分析、オンラインリソースをワークフローの一部として活用するのに最適です。',
        tip: '特定のオンラインリソース、ドキュメントサイト、または現在のタスクに価値があるウェブベースのデータをAIに操作させる必要がある場合に有効にしてください。'
      },
      generateImage: {
        description:
          'AIがあなたの説明に基づいてカスタム画像を作成できるようにします。デザインモックアップ、UI要素、概念図、紙芝居、商品画像、マーケティングコンテンツなど、幅広い用途に活用できます。Stability AIやAmazon Titan画像生成モデルなどが利用可能です。',
        tip: 'プロジェクトの視覚的要素が必要な場合、UIデザインを素早くプロトタイプ化したい場合、または実装前にコンセプトを視覚化する必要がある場合に使用してください。'
      },
      retrieve: {
        description:
          'AIが組織のナレッジベースにアクセスできるようにします。企業固有の情報、社内ドキュメント、オンラインでは広く入手できない専門知識へのアクセスに不可欠です。Knowledge Base に事前にデータを保存しておく必要があります。',
        tip: 'AIに専門のナレッジベース、社内ドキュメント、特定分野の情報へのアクセスを与え、より関連性が高く、文脈を考慮した回答を得るために有効にしてください。'
      },
      invokeBedrockAgent: {
        description:
          'AIを専門のBedrock Agentsと接続し、データ分析、コード解釈、通常のチャット機能を超えるドメイン固有の操作など、複雑なタスクを実行できるようにします。Amazon Bedrockで事前にエージェントを設定しておく必要があります。',
        tip: 'コード実行、データ分析、特定のツールを持つ専用エージェントが必要なドメイン固有の知識など、特殊な機能が必要な場合に使用してください。'
      },
      executeCommand: {
        description:
          'AIにシステムコマンドを実行させて開発タスクを自動化できるようにします。ビルド操作、テスト、デプロイタスク、またはコマンドラインを使用する一般的なワークフローに最適です。',
        tip: 'AIにDevOpsタスク、テスト実行、プロジェクトのビルド、または繰り返しのコマンドライン操作の自動化を支援させたい場合に有効にしてください。セキュリティのため、事前に承認されたコマンドパターンのみが許可されています。'
      }
    }
  }
}
