export const agentToolsSettings = {
  en: {
    'Agent Tools': 'Agent Tools',
    'e.g., KB123456': 'e.g., KB123456',
    'e.g., Customer support knowledge base': 'e.g., Customer support knowledge base',
    'e.g., ls *': 'e.g., ls *',
    'e.g., List directory contents': 'e.g., List directory contents',
    'e.g., AGENT123456': 'e.g., AGENT123456',
    'e.g., ALIAS123456': 'e.g., ALIAS123456',
    'e.g., Code interpreter agent': 'e.g., Code interpreter agent',
    'ID:': 'ID:',
    'Agent ID:': 'Agent ID:',
    'Alias ID:': 'Alias ID:',
    'tools.category': 'Preset Category',
    'No tools in this category': 'No tools in this category',
    'Tool Categories.General Purpose': 'General Purpose',
    'Tool Categories.Software Development': 'Software Development',
    'Tool Categories.Design & Creative': 'Design & Creative',
    'Tool Categories.Data Analysis': 'Data Analysis',
    'Tool Categories.Business & Productivity': 'Business & Productivity',
    'Tool Categories.Custom Configuration': 'Custom Configuration',
    'Tool Categories.File System': 'File System',
    'Tool Categories.File System Description': 'Tools for managing files and directories',
    'Tool Categories.Web & Search': 'Web & Search',
    'Tool Categories.Web & Search Description': 'Tools for interacting with web resources',
    'Tool Categories.AI Services': 'AI Services',
    'Tool Categories.AI Services Description': 'Tools that utilize AWS AI services',
    'Tool Categories.System': 'System',
    'Tool Categories.System Description': 'Tools for system interaction',
    'Tool Categories.Thinking': 'Thinking',
    'Tool Categories.Thinking Description':
      'Tools for enhanced reasoning and complex problem solving',
    'Tool Categories.MCP': 'MCP',
    'Tool Categories.MCP Description': 'Model Context Protocol Tools',
    'Tool Categories.All Configuration': 'All',
    'tools.description': 'Select the tools this agent can use.',
    'Available Tools': 'Available Tools',
    'Tool Detail Settings': 'Tool Detail Settings',
    'Configure settings for enabled tools': 'Configure settings for enabled tools',
    'Tool Detail Settings Description':
      'In this tab, you can configure advanced settings for specific tools. Settings are available for Knowledge Base retrieval, command execution, and Bedrock Agent invocation when these tools are enabled.',
    'No tools enabled. Enable tools in the Available Tools tab to configure them.':
      'No tools enabled. Enable tools in the Available Tools tab to configure them.',
    'Knowledge Base Settings': 'Knowledge Base Settings',
    'Command Settings': 'Command Settings',
    'Bedrock Agent Settings': 'Bedrock Agent Settings',
    'Recognition Model': 'Recognition Model',
    'When an image is processed, the AI will identify objects, text, scenes, and other visual elements, providing a detailed description based on the content.':
      'When an image is processed, the AI will identify objects, text, scenes, and other visual elements, providing a detailed description based on the content.',
    'tool info.recognizeImage.description':
      'The recognizeImage tool uses AI vision capabilities to analyze and describe images. It helps the AI assistant understand image content and provide relevant responses based on what appears in the image.',
    'tool info.generateImage.description':
      'The generateImage tool uses AI image generation capabilities to create images from text descriptions. It helps the AI assistant generate visual content based on textual prompts and save them to specified locations.',
    'tool info.generateVideo.description':
      'The generateVideo tool uses Amazon Nova Reel to create high-quality videos from text descriptions. Videos are generated asynchronously and require S3 configuration for output storage.',
    'Image Generation Model': 'Image Generation Model',
    'Important Notes': 'Important Notes',
    'Model availability may vary by AWS region': 'Model availability may vary by AWS region',
    'Different models support different aspect ratios and features':
      'Different models support different aspect ratios and features',
    'Image generation costs vary by model and output resolution':
      'Image generation costs vary by model and output resolution',
    'Configure knowledge bases for the retrieve tool':
      'Configure knowledge bases for the retrieve tool',
    'Configure allowed commands for the executeCommand tool':
      'Configure allowed commands for the executeCommand tool',
    'Configure Bedrock Agents for the invokeBedrockAgent tool':
      'Configure Bedrock Agents for the invokeBedrockAgent tool',
    'Configure Bedrock Flows for the invokeFlow tool':
      'Configure Bedrock Flows for the invokeFlow tool',
    'No configurable tools enabled. Enable retrieve, executeCommand, invokeBedrockAgent, or invokeFlow tools to access their configurations.':
      'No configurable tools enabled. Enable retrieve, executeCommand, invokeBedrockAgent, or invokeFlow tools to access their configurations.',
    'Configure which knowledge bases this agent can access.':
      'Configure which knowledge bases this agent can access.',
    'Add New Knowledge Base': 'Add New Knowledge Base',
    'Knowledge Base ID': 'Knowledge Base ID',
    Description: 'Description',
    'Add Knowledge Base': 'Add Knowledge Base',
    'Available Knowledge Bases': 'Available Knowledge Bases',
    'No knowledge bases registered yet': 'No knowledge bases registered yet',
    Edit: 'Edit',
    'Edit knowledge base': 'Edit knowledge base',
    Remove: 'Remove',
    'Remove knowledge base': 'Remove knowledge base',
    Cancel: 'Cancel',
    Save: 'Save',
    'Configure which system commands the agent is allowed to execute.':
      'Configure which system commands the agent is allowed to execute.',
    'Security Warning': 'Security Warning',
    'Only allow commands that you trust this agent to execute. Use wildcards (*) to define patterns.':
      'Only allow commands that you trust this agent to execute. Use wildcards (*) to define patterns.',
    'Add New Command Pattern': 'Add New Command Pattern',
    'Command Pattern': 'Command Pattern',
    'Use * as a wildcard (e.g., "npm *" allows all npm commands)':
      'Use * as a wildcard (e.g., "npm *" allows all npm commands)',
    'Add Command': 'Add Command',
    'Current Command Patterns': 'Current Command Patterns',
    'No command patterns registered yet': 'No command patterns registered yet',
    'Edit command': 'Edit command',
    'Remove command': 'Remove command',
    'Configure which Bedrock Agents this agent can access.':
      'Configure which Bedrock Agents this agent can access.',
    'Add New Bedrock Agent': 'Add New Bedrock Agent',
    'Agent ID': 'Agent ID',
    'Alias ID': 'Alias ID',
    'Add Agent': 'Add Agent',
    'Available Bedrock Agents': 'Available Bedrock Agents',
    'No Bedrock Agents registered yet': 'No Bedrock Agents registered yet',
    'Edit agent': 'Edit agent',
    'Remove agent': 'Remove agent',
    'Flow Settings': 'Flow Settings',
    'Configure which Bedrock Flows this agent can access.':
      'Configure which Bedrock Flows this agent can access.',
    'Add New Bedrock Flow': 'Add New Bedrock Flow',
    'Edit Bedrock Flow': 'Edit Bedrock Flow',
    'Flow ID': 'Flow ID',
    'Flow Alias ID': 'Flow Alias ID',
    'Add Flow': 'Add Flow',
    'Update Flow': 'Update Flow',
    'Available Bedrock Flows': 'Available Bedrock Flows',
    'Registered Bedrock Flows': 'Registered Bedrock Flows',
    'No Bedrock Flows registered yet': 'No Bedrock Flows registered yet',
    'Input Type': 'Input Type',
    String: 'String',
    Number: 'Number',
    Boolean: 'Boolean',
    Object: 'Object',
    Array: 'Array',
    'JSON Schema': 'JSON Schema',
    Schema: 'Schema',
    'Define the structure of the object that will be sent to the Flow.':
      'Define the structure of the object that will be sent to the Flow.',
    'Define the structure of the array that will be sent to the Flow.':
      'Define the structure of the array that will be sent to the Flow.',
    'flow.sample.title': 'Sample Templates',
    'flow.sample.object.simple': 'Simple',
    'flow.sample.object.nested': 'Nested',
    'flow.sample.object.complex': 'Complex',
    'flow.sample.array.simple': 'Simple',
    'flow.sample.array.objects': 'Objects',
    'flow.sample.array.complex': 'Complex',
    'flow.sample.object.simple.tooltip': 'Simple object (name, age, state)',
    'flow.sample.object.nested.tooltip': 'Nested object (user info and settings)',
    'flow.sample.object.complex.tooltip': 'Complex object (profile, preferences, tags, etc.)',
    'flow.sample.array.simple.tooltip': 'Array of strings',
    'flow.sample.array.objects.tooltip': 'Array of objects (ID, name, tags)',
    'flow.sample.array.complex.tooltip': 'Array of complex objects (task data, etc.)',
    'flow.editor.title': 'Schema Editor',
    'flow.hint.title': 'Hint',
    'flow.hint.description':
      'Use JSON Schema to define the structure of data sent to the Flow. This helps the AI send data in the correct format.',
    'tool info.invokeFlow.description':
      'Invoke AWS Bedrock Flow to execute the specified flow. Flows can be used to automate workflows consisting of multiple steps.',
    'tool info.invokeFlow.about title': 'About AWS Bedrock Flow',
    'tool info.invokeFlow.about description':
      'AWS Bedrock Flow allows you to create and execute workflows that can process data, make decisions, and take actions based on AI model outputs. By configuring flows for your agent, you can enable it to perform complex operations that may involve multiple steps or services.',
    'View JSON Spec': 'View JSON Spec',
    'Tool Specification (JSON)': 'Tool Specification (JSON)',
    'No tool specification available': 'No tool specification available',
    'MCP Tool Info': 'MCP Tool Info',
    'MCP tools are provided by Model Context Protocol servers. Click the JSON button above to view the full tool specification.':
      'MCP tools are provided by Model Context Protocol servers. Click the JSON button above to view the full tool specification.',
    // CameraCapture tool specific translations
    'tool info.cameraCapture.description':
      'The cameraCapture tool captures images from PC camera and saves them as image files. When a recognition prompt is provided, the captured image will be automatically analyzed with AI to extract text content, identify objects, and provide detailed visual descriptions for analysis and documentation purposes.',
    'AI Image Analysis Settings': 'AI Image Analysis Settings',
    'AI Model for Image Analysis': 'AI Model for Image Analysis',
    'Image Quality': 'Image Quality',
    'Low (640x480)': 'Low (640x480)',
    'Medium (1280x720)': 'Medium (1280x720)',
    'High (1920x1080)': 'High (1920x1080)',
    'How to Use': 'How to Use',
    'Camera capture only': 'Camera capture only',
    'Use without any prompt to capture camera image only':
      'Use without any prompt to capture camera image only',
    'Camera capture + AI analysis': 'Camera capture + AI analysis',
    'Provide a recognition prompt to automatically analyze the captured image':
      'Provide a recognition prompt to automatically analyze the captured image',
    'Example prompts': 'Example prompts',
    '"Describe what you see in this image", "Read any text in this photo", "Identify objects in the camera view"':
      '"Describe what you see in this image", "Read any text in this photo", "Identify objects in the camera view"',
    'Platform Requirements': 'Platform Requirements',
    'Camera access permission required in System Preferences > Security & Privacy > Privacy > Camera':
      'Camera access permission required in System Preferences > Security & Privacy > Privacy > Camera',
    'Camera access permission required in Windows Settings > Privacy > Camera':
      'Camera access permission required in Windows Settings > Privacy > Camera',
    'Camera Access Permissions': 'Camera Access Permissions',
    Refresh: 'Refresh',
    'Select which cameras this agent is allowed to access for image capture. Only selected cameras can be used for photography.':
      'Select which cameras this agent is allowed to access for image capture. Only selected cameras can be used for photography.',
    'Loading camera devices...': 'Loading camera devices...',
    'No cameras available. Click refresh to try again.':
      'No cameras available. Click refresh to try again.',
    'Preview not available': 'Preview not available',
    'Live Preview': 'Live Preview',
    '{{count}} camera(s) allowed': '{{count}} camera(s) allowed',
    'Usage Tips': 'Usage Tips',
    'If no cameras are selected, the agent can use the default camera':
      'If no cameras are selected, the agent can use the default camera',
    'Camera permissions are checked each time before capture':
      'Camera permissions are checked each time before capture',
    'Use the refresh button to update the list of available cameras':
      'Use the refresh button to update the list of available cameras',
    'Live preview may not be available for all camera devices':
      'Live preview may not be available for all camera devices',
    'Camera Preview Window': 'Camera Preview Window',
    'Display a live camera preview window on your screen. This allows you to see what the camera captures in real-time without taking photos.':
      'Display a live camera preview window on your screen. This allows you to see what the camera captures in real-time without taking photos.',
    'Preview Window Size': 'Preview Window Size',
    'Small (200×150)': 'Small (200×150)',
    'Medium (320×240)': 'Medium (320×240)',
    'Large (480×360)': 'Large (480×360)',
    'Preview Window Position': 'Preview Window Position',
    'Bottom Right': 'Bottom Right',
    'Bottom Left': 'Bottom Left',
    'Top Right': 'Top Right',
    'Top Left': 'Top Left',
    'Window Opacity': 'Window Opacity',
    'Preview Window Active': 'Preview Window Active',
    'Preview Window Inactive': 'Preview Window Inactive',
    'The camera preview window is currently displayed on your screen.':
      'The camera preview window is currently displayed on your screen.',
    'Enable the toggle above to show the camera preview window.':
      'Enable the toggle above to show the camera preview window.',
    'Preview Window Features': 'Preview Window Features',
    'Always on top - stays visible above other windows':
      'Always on top - stays visible above other windows',
    'Draggable - can be moved around the screen': 'Draggable - can be moved around the screen',
    'Live camera feed - shows real-time video from your camera':
      'Live camera feed - shows real-time video from your camera',
    'Hover controls - settings and close buttons appear on mouse hover':
      'Hover controls - settings and close buttons appear on mouse hover',
    'Automatic positioning - remembers your preferred screen location':
      'Automatic positioning - remembers your preferred screen location',
    'Preview window requires camera permission': 'Preview window requires camera permission',
    'Only one preview window can be active at a time':
      'Only one preview window can be active at a time',
    'Settings changes apply immediately to active preview':
      'Settings changes apply immediately to active preview',
    'Close the preview window to free up camera resources':
      'Close the preview window to free up camera resources',
    descriptions: {
      createFolder: 'Create a new folder at the specified path',
      writeToFile: 'Write content to an existing file',
      readFiles: 'Read the content of multiple files',
      listFiles: 'List the entire directory structure',
      moveFile: 'Move a file from one location to another',
      copyFile: 'Copy a file from one location to another',
      applyDiffEdit: 'Apply a diff edit to a file',
      tavilySearch: 'Search the web using Tavily API',
      fetchWebsite: 'Fetch content from a specified URL',
      generateImage: 'Generate an image using AI models',
      generateVideo: 'Generate high-quality videos using Amazon Nova Reel',
      recognizeImage: 'Analyze and describe images using AI vision capabilities',
      retrieve: 'Retrieve information from a knowledge base',
      invokeBedrockAgent: 'Invoke an Amazon Bedrock Agent',
      executeCommand: 'Execute a command or send input to a running process',
      invokeFlow: 'Execute an AWS Bedrock Flow to automate multi-step workflows',
      think: 'Use enhanced reasoning for complex problem solving',
      cameraCapture: 'Capture images from PC camera and analyze with AI vision capabilities',
      codeInterpreter: 'Execute Python code with data analysis capabilities and file operations',
      screenCapture: 'Capture screenshots of the screen for analysis and documentation'
    }
  },
  ja: {
    'Agent Tools': 'エージェントツール',
    'e.g., KB123456': '例: KB123456',
    'e.g., Customer support knowledge base': '例: カスタマーサポートのナレッジベース',
    'e.g., ls *': '例: ls *',
    'e.g., List directory contents': '例: ディレクトリ内容を一覧表示',
    'e.g., AGENT123456': '例: AGENT123456',
    'e.g., ALIAS123456': '例: ALIAS123456',
    'e.g., Code interpreter agent': '例: コードインタープリターエージェント',
    'ID:': 'ID:',
    'Agent ID:': 'エージェントID:',
    'Alias ID:': 'エイリアスID:',
    'tools.category': 'プリセットされたカテゴリから選ぶ',
    'No tools in this category': 'このカテゴリにツールはありません',
    'Tool Categories.General Purpose': '一般目的',
    'Tool Categories.Software Development': 'ソフトウェア開発',
    'Tool Categories.Design & Creative': 'デザイン＆クリエイティブ',
    'Tool Categories.Data Analysis': 'データ分析',
    'Tool Categories.Business & Productivity': 'ビジネス＆生産性',
    'Tool Categories.Custom Configuration': 'カスタム設定',
    'Tool Categories.File System': 'ファイルシステム',
    'Tool Categories.File System Description': 'ファイルとディレクトリを管理するツール',
    'Tool Categories.Web & Search': 'Web＆検索',
    'Tool Categories.Web & Search Description': 'Webリソースとの連携ツール',
    'Tool Categories.AI Services': 'AIサービス',
    'Tool Categories.AI Services Description': 'AWS AIサービスを活用するツール',
    'Tool Categories.System': 'システム',
    'Tool Categories.System Description': 'システム連携ツール',
    'Tool Categories.Thinking': '思考',
    'Tool Categories.Thinking Description': '高度な推論と複雑な問題解決のためのツール',
    'Tool Categories.MCP': 'MCP',
    'Tool Categories.MCP Description': 'Model Context Protocol ツール',
    'Tool Categories.All Configuration': '全て',
    'tools.description': 'このエージェントが使用できるツールを選択します。',
    'Available Tools': '利用可能なツール',
    'Tool Detail Settings': 'ツールの詳細設定',
    'Configure settings for enabled tools': '有効なツールの設定を構成する',
    'Tool Detail Settings Description':
      'このタブでは、特定のツールの詳細設定を行えます。ナレッジベース検索、コマンド実行、Bedrock Agentの呼び出しなど、これらのツールが有効になっている場合に設定が可能です。',
    'No tools enabled. Enable tools in the Available Tools tab to configure them.':
      'ツールが有効化されていません。「利用可能なツール」タブでツールを有効にして設定してください。',
    'Knowledge Base Settings': 'ナレッジベース設定',
    'Command Settings': 'コマンド設定',
    'Bedrock Agent Settings': 'Bedrock Agent設定',
    'Recognition Model': '認識モデル',
    'When an image is processed, the AI will identify objects, text, scenes, and other visual elements, providing a detailed description based on the content.':
      '画像が処理されると、AIは物体、テキスト、シーン、その他の視覚要素を識別し、内容に基づいた詳細な説明を提供します。',
    'tool info.recognizeImage.description':
      'recognizeImageツールはAIのビジョン機能を使用して画像を分析・説明します。AIアシスタントが画像の内容を理解し、画像に表示されているものに基づいて関連する回答を提供するのに役立ちます。',
    'tool info.generateImage.description':
      'generateImageツールはAIの画像生成機能を使用してテキストの説明から画像を作成します。AIアシスタントがテキストプロンプトに基づいて視覚的なコンテンツを生成し、指定された場所に保存するのに役立ちます。',
    'tool info.generateVideo.description':
      'generateVideoツールはAmazon Nova Reelを使用してテキストの説明から高品質な動画を作成します。動画は非同期で生成され、出力保存にはS3設定が必要です。',
    'Image Generation Model': '画像生成モデル',
    'Important Notes': '重要な注意事項',
    'Model availability may vary by AWS region':
      'モデルの利用可能性はAWSリージョンによって異なる場合があります',
    'Different models support different aspect ratios and features':
      '異なるモデルは異なるアスペクト比と機能をサポートしています',
    'Image generation costs vary by model and output resolution':
      '画像生成のコストはモデルと出力解像度によって異なります',
    'Configure knowledge bases for the retrieve tool': 'retrieve ツール用のナレッジベースを設定',
    'Configure allowed commands for the executeCommand tool':
      'executeCommand ツール用の許可コマンドを設定',
    'Configure Bedrock Agents for the invokeBedrockAgent tool':
      'invokeBedrockAgent ツール用の Bedrock Agent を設定',
    'Configure Bedrock Flows for the invokeFlow tool': 'invokeFlow ツール用の Bedrock Flow を設定',
    'No configurable tools enabled. Enable retrieve, executeCommand, invokeBedrockAgent, or invokeFlow tools to access their configurations.':
      '設定可能なツールが有効になっていません。retrieve、executeCommand、invokeBedrockAgent、または invokeFlow ツールを有効にして設定にアクセスしてください。',
    'Configure which knowledge bases this agent can access.':
      'このエージェントがアクセスできるナレッジベースを設定します。',
    'Add New Knowledge Base': '新しいナレッジベースを追加',
    'Knowledge Base ID': 'ナレッジベースID',
    Description: '説明',
    'Add Knowledge Base': 'ナレッジベースを追加',
    'Available Knowledge Bases': '利用可能なナレッジベース',
    'No knowledge bases registered yet': 'まだナレッジベースが登録されていません',
    Edit: '編集',
    'Edit knowledge base': 'ナレッジベースを編集',
    Remove: '削除',
    'Remove knowledge base': 'ナレッジベースを削除',
    Cancel: 'キャンセル',
    Save: '保存',
    'Configure which system commands the agent is allowed to execute.':
      'このエージェントが実行を許可されたシステムコマンドを設定します。',
    'Security Warning': 'セキュリティ警告',
    'Only allow commands that you trust this agent to execute. Use wildcards (*) to define patterns.':
      '信頼できるコマンドのみを許可してください。ワイルドカード(*)を使用してパターンを定義できます。',
    'Add New Command Pattern': '新しいコマンドパターンを追加',
    'Command Pattern': 'コマンドパターン',
    'Use * as a wildcard (e.g., "npm *" allows all npm commands)':
      'ワイルドカード * を使用できます（例: "npm *" はすべての npm コマンドを許可）',
    'Add Command': 'コマンドを追加',
    'Current Command Patterns': '現在のコマンドパターン',
    'No command patterns registered yet': 'まだコマンドパターンが登録されていません',
    'Edit command': 'コマンドを編集',
    'Remove command': 'コマンドを削除',
    'Configure which Bedrock Agents this agent can access.':
      'このエージェントがアクセスできる Bedrock Agent を設定します。',
    'Add New Bedrock Agent': '新しい Bedrock Agent を追加',
    'Agent ID': 'エージェントID',
    'Alias ID': 'エイリアスID',
    'Add Agent': 'エージェントを追加',
    'Available Bedrock Agents': '利用可能な Bedrock Agent',
    'No Bedrock Agents registered yet': 'まだ Bedrock Agent が登録されていません',
    'Edit agent': 'エージェントを編集',
    'Remove agent': 'エージェントを削除',
    'Flow Settings': 'フロー設定',
    'Configure which Bedrock Flows this agent can access.':
      'このエージェントがアクセスできる Bedrock Flow を設定します。',
    'Add New Bedrock Flow': '新しい Bedrock Flow を追加',
    'Edit Bedrock Flow': 'Bedrock Flow を編集',
    'Flow ID': 'フローID',
    'Flow Alias ID': 'フローエイリアスID',
    'Add Flow': 'フローを追加',
    'Update Flow': 'フローを更新',
    'Available Bedrock Flows': '利用可能な Bedrock Flow',
    'Registered Bedrock Flows': '登録済み Bedrock Flow',
    'No Bedrock Flows registered yet': 'まだ Bedrock Flow が登録されていません',
    'Input Type': '入力タイプ',
    String: '文字列',
    Number: '数値',
    Boolean: '真偽値',
    Object: 'オブジェクト',
    Array: '配列',
    'JSON Schema': 'JSONスキーマ',
    Schema: 'スキーマ',
    'Define the structure of the object that will be sent to the Flow.':
      'Flowに送信されるオブジェクトの構造を定義します。',
    'Define the structure of the array that will be sent to the Flow.':
      'Flowに送信される配列の構造を定義します。',
    'flow.sample.title': 'サンプルテンプレート',
    'flow.sample.object.simple': 'シンプル',
    'flow.sample.object.nested': 'ネスト',
    'flow.sample.object.complex': '複雑',
    'flow.sample.array.simple': 'シンプル',
    'flow.sample.array.objects': 'オブジェクト',
    'flow.sample.array.complex': '複雑',
    'flow.sample.object.simple.tooltip': 'シンプルなオブジェクト（名前、年齢、状態）',
    'flow.sample.object.nested.tooltip': 'ネストしたオブジェクト（ユーザー情報と設定）',
    'flow.sample.object.complex.tooltip': '複雑なオブジェクト（プロフィール、設定、タグなど）',
    'flow.sample.array.simple.tooltip': '文字列の配列',
    'flow.sample.array.objects.tooltip': 'オブジェクトの配列（ID、名前、タグ）',
    'flow.sample.array.complex.tooltip': '複雑なオブジェクトの配列（タスクデータなど）',
    'flow.editor.title': 'スキーマエディタ',
    'flow.hint.title': 'ヒント',
    'flow.hint.description':
      'JSON Schemaを使用して、Flowに送信するデータの構造を定義します。これにより、AIがFlowに正しい形式のデータを送信できるようになります。',
    'tool info.invokeFlow.description':
      'AWS Bedrock Flowを実行して指定されたフローを実行します。フローは複数のステップからなるワークフローを自動化するために使用できます。',
    'tool info.invokeFlow.about title': 'AWS Bedrock Flowについて',
    'tool info.invokeFlow.about description':
      'AWS Bedrock Flowを使用すると、データを処理し、決定を下し、AIモデルの出力に基づいてアクションを実行するワークフローを作成および実行できます。エージェントにフローを設定することで、複数のステップやサービスを含む複雑な操作を実行できるようになります。',
    'View JSON Spec': 'JSON仕様を表示',
    'Tool Specification (JSON)': 'ツール仕様 (JSON)',
    'No tool specification available': 'ツール仕様は利用できません',
    'MCP Tool Info': 'MCPツール情報',
    'MCP tools are provided by Model Context Protocol servers. Click the JSON button above to view the full tool specification.':
      'MCPツールはModel Context Protocolサーバーによって提供されます。完全なツール仕様を表示するには、上記のJSONボタンをクリックしてください。',
    // CameraCapture tool specific translations
    'tool info.cameraCapture.description':
      'cameraCaptureツールはPCのカメラから画像をキャプチャし、画像ファイルとして保存します。認識プロンプトが提供されると、キャプチャされた画像は自動的にAIで分析され、テキスト内容の抽出、オブジェクトの識別、分析・文書化目的での詳細な視覚的説明が提供されます。',
    'AI Image Analysis Settings': 'AI画像分析設定',
    'AI Model for Image Analysis': '画像分析用AIモデル',
    'Image Quality': '画像品質',
    'Low (640x480)': '低画質 (640x480)',
    'Medium (1280x720)': '中画質 (1280x720)',
    'High (1920x1080)': '高画質 (1920x1080)',
    'How to Use': '使用方法',
    'Camera capture only': 'カメラキャプチャのみ',
    'Use without any prompt to capture camera image only':
      'プロンプトなしでカメラ画像のみをキャプチャ',
    'Camera capture + AI analysis': 'カメラキャプチャ + AI分析',
    'Provide a recognition prompt to automatically analyze the captured image':
      '認識プロンプトを提供してキャプチャした画像を自動分析',
    'Example prompts': 'プロンプト例',
    '"Describe what you see in this image", "Read any text in this photo", "Identify objects in the camera view"':
      '「この画像で何を見ているか説明して」、「この写真のテキストを読んで」、「カメラビューのオブジェクトを識別して」',
    'Platform Requirements': 'プラットフォーム要件',
    'Camera access permission required in System Preferences > Security & Privacy > Privacy > Camera':
      'システム環境設定 > セキュリティとプライバシー > プライバシー > カメラでカメラアクセス許可が必要',
    'Camera access permission required in Windows Settings > Privacy > Camera':
      'Windows設定 > プライバシー > カメラでカメラアクセス許可が必要',
    'Camera Access Permissions': 'カメラアクセス許可',
    Refresh: '更新',
    'Select which cameras this agent is allowed to access for image capture. Only selected cameras can be used for photography.':
      'このエージェントが画像キャプチャでアクセスを許可するカメラを選択してください。選択されたカメラのみが撮影に使用できます。',
    'Loading camera devices...': 'カメラデバイスを読み込み中...',
    'No cameras available. Click refresh to try again.':
      '利用可能なカメラがありません。更新をクリックして再試行してください。',
    'Preview not available': 'プレビュー利用不可',
    'Live Preview': 'ライブプレビュー',
    '{{count}} camera(s) allowed': '{{count}}台のカメラが許可されています',
    'Usage Tips': '使用のヒント',
    'If no cameras are selected, the agent can use the default camera':
      'カメラが選択されていない場合、エージェントはデフォルトカメラを使用できます',
    'Camera permissions are checked each time before capture':
      'カメラの許可はキャプチャ前に毎回確認されます',
    'Use the refresh button to update the list of available cameras':
      '更新ボタンを使用して利用可能なカメラリストを更新してください',
    'Live preview may not be available for all camera devices':
      'ライブプレビューはすべてのカメラデバイスで利用できるとは限りません',
    'Camera Preview Window': 'カメラプレビューウィンドウ',
    'Display a live camera preview window on your screen. This allows you to see what the camera captures in real-time without taking photos.':
      '画面にライブカメラプレビューウィンドウを表示します。これにより、写真を撮影することなく、カメラがキャプチャしているものをリアルタイムで確認できます。',
    'Preview Window Size': 'プレビューウィンドウサイズ',
    'Small (200×150)': '小 (200×150)',
    'Medium (320×240)': '中 (320×240)',
    'Large (480×360)': '大 (480×360)',
    'Preview Window Position': 'プレビューウィンドウ位置',
    'Bottom Right': '右下',
    'Bottom Left': '左下',
    'Top Right': '右上',
    'Top Left': '左上',
    'Window Opacity': 'ウィンドウの透明度',
    'Preview Window Active': 'プレビューウィンドウがアクティブ',
    'Preview Window Inactive': 'プレビューウィンドウが非アクティブ',
    'The camera preview window is currently displayed on your screen.':
      'カメラプレビューウィンドウが現在画面に表示されています。',
    'Enable the toggle above to show the camera preview window.':
      '上記のトグルを有効にしてカメラプレビューウィンドウを表示してください。',
    'Preview Window Features': 'プレビューウィンドウ機能',
    'Always on top - stays visible above other windows':
      '常に最前面 - 他のウィンドウの上に表示されます',
    'Draggable - can be moved around the screen': 'ドラッグ可能 - 画面上で移動できます',
    'Live camera feed - shows real-time video from your camera':
      'ライブカメラフィード - カメラからのリアルタイム映像を表示',
    'Hover controls - settings and close buttons appear on mouse hover':
      'ホバーコントロール - マウスホバーで設定と閉じるボタンが表示',
    'Automatic positioning - remembers your preferred screen location':
      '自動位置調整 - 好みの画面位置を記憶',
    'Preview window requires camera permission': 'プレビューウィンドウにはカメラ許可が必要',
    'Only one preview window can be active at a time':
      '同時にアクティブにできるプレビューウィンドウは1つのみ',
    'Settings changes apply immediately to active preview':
      '設定の変更はアクティブなプレビューに即座に適用されます',
    'Close the preview window to free up camera resources':
      'プレビューウィンドウを閉じてカメラリソースを解放してください',
    descriptions: {
      createFolder: '指定したパスに新しいフォルダを作成',
      writeToFile: '既存のファイルにコンテンツを書き込み',
      readFiles: '複数ファイルの内容を読み取り',
      listFiles: 'ディレクトリ構造を一覧表示',
      moveFile: 'ファイルを別の場所に移動',
      copyFile: 'ファイルを別の場所にコピー',
      applyDiffEdit: 'ファイルに差分編集を適用',
      tavilySearch: 'Tavily APIを使用してWeb検索',
      fetchWebsite: '指定したURLからコンテンツを取得',
      generateImage: 'AIモデルを使用して画像を生成',
      generateVideo: 'Amazon Nova Reelを使用して高品質な動画を生成',
      recognizeImage: 'AIのビジョン機能を使用して画像を分析・説明',
      retrieve: 'ナレッジベースから情報を取得',
      invokeBedrockAgent: 'Amazon Bedrock Agentを呼び出し',
      executeCommand: 'コマンドを実行または実行中のプロセスに入力を送信',
      invokeFlow: 'AWS Bedrock Flowを実行して複数ステップのワークフローを自動化',
      think: '複雑な問題解決のための高度な推論を使用',
      cameraCapture: 'PCカメラから画像をキャプチャしてAIビジョン機能で分析',
      codeInterpreter: 'Pythonコードを実行しデータ分析機能とファイル操作を提供',
      screenCapture: 'スクリーンのスクリーンショットをキャプチャして分析・文書化'
    }
  }
}
