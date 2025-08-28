# カスタムモデルインポート設定ガイド

Amazon Bedrock の Custom Model Import 機能で取り込んだカスタムモデルを Bedrock Engineer で使用するための設定方法を説明します。

## 概要

Amazon Bedrock の Custom Model Import 機能を使用することで、Hugging Face などで公開されているオープンソースモデルを Bedrock 上で動作させることができます。Bedrock Engineer では、これらのカスタムインポートモデルをチャット機能で使用できるように設定することが可能です。(Experimental: 予告なく破壊的変更を行うことがあります)

## カスタムモデルのインポート

### DeepSeek-R1-Distill-Llama-8B の例

### 1. **モデルのダウンロード**

```bash
# Git LFS のインストール（Macの場合）
brew install git-lfs
git lfs install

# モデルのクローン
git clone https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-8B
```

### 2. **tokenizer_config.json の設定**

Converse API を使用するため、chat_template を Llama-3.1 形式に変更します。
その他のモデルタイプに関しては以下のドキュメントを参照してください。

[Converse API code samples for custom model import
](https://docs.aws.amazon.com/bedrock/latest/userguide/custom-model-import-code-samples-converse.html)

````diff
  {
  "add_bos_token": true,
  "add_eos_token": false,
  "bos_token": {
    "__type": "AddedToken",
    "content": "<｜begin▁of▁sentence｜>",
    "lstrip": false,
    "normalized": true,
    "rstrip": false,
    "single_word": false
  },
  "clean_up_tokenization_spaces": false,
  "eos_token": {
    "__type": "AddedToken",
    "content": "<｜end▁of▁sentence｜>",
    "lstrip": false,
    "normalized": true,
    "rstrip": false,
    "single_word": false
  },
  "legacy": true,
  "model_max_length": 16384,
  "pad_token": {
    "__type": "AddedToken",
    "content": "<｜end▁of▁sentence｜>",
    "lstrip": false,
    "normalized": true,
    "rstrip": false,
    "single_word": false
  },
  "sp_model_kwargs": {},
  "unk_token": null,
  "tokenizer_class": "LlamaTokenizerFast",
-   "chat_template": "{% if not add_generation_prompt is defined %}{% set add_generation_prompt = false %}{% endif %}{% set ns = namespace(is_first=false, is_tool=false, is_output_first=true, system_prompt='') %}{%- for message in messages %}{%- if message['role'] == 'system' %}{% set ns.system_prompt = message['content'] %}{%- endif %}{%- endfor %}{{bos_token}}{{ns.system_prompt}}{%- for message in messages %}{%- if message['role'] == 'user' %}{%- set ns.is_tool = false -%}{{'<｜User｜>' + message['content']}}{%- endif %}{%- if message['role'] == 'assistant' and message['content'] is none %}{%- set ns.is_tool = false -%}{%- for tool in message['tool_calls']%}{%- if not ns.is_first %}{{'<｜Assistant｜><｜tool▁calls▁begin｜><｜tool▁call▁begin｜>' + tool['type'] + '<｜tool▁sep｜>' + tool['function']['name'] + '\\n' + '```json' + '\\n' + tool['function']['arguments'] + '\\n' + '```' + '<｜tool▁call▁end｜>'}}{%- set ns.is_first = true -%}{%- else %}{{'\\n' + '<｜tool▁call▁begin｜>' + tool['type'] + '<｜tool▁sep｜>' + tool['function']['name'] + '\\n' + '```json' + '\\n' + tool['function']['arguments'] + '\\n' + '```' + '<｜tool▁call▁end｜>'}}{{'<｜tool▁calls▁end｜><｜end▁of▁sentence｜>'}}{%- endif %}{%- endfor %}{%- endif %}{%- if message['role'] == 'assistant' and message['content'] is not none %}{%- if ns.is_tool %}{{'<｜tool▁outputs▁end｜>' + message['content'] + '<｜end▁of▁sentence｜>'}}{%- set ns.is_tool = false -%}{%- else %}{% set content = message['content'] %}{% if '</think>' in content %}{% set content = content.split('</think>')[-1] %}{% endif %}{{'<｜Assistant｜>' + content + '<｜end▁of▁sentence｜>'}}{%- endif %}{%- endif %}{%- if message['role'] == 'tool' %}{%- set ns.is_tool = true -%}{%- if ns.is_output_first %}{{'<｜tool▁outputs▁begin｜><｜tool▁output▁begin｜>' + message['content'] + '<｜tool▁output▁end｜>'}}{%- set ns.is_output_first = false %}{%- else %}{{'\\n<｜tool▁output▁begin｜>' + message['content'] + '<｜tool▁output▁end｜>'}}{%- endif %}{%- endif %}{%- endfor -%}{% if ns.is_tool %}{{'<｜tool▁outputs▁end｜>'}}{% endif %}{% if add_generation_prompt and not ns.is_tool %}{{'<｜Assistant｜><think>\\n'}}{% endif %}",
+  "chat_template": "{{- bos_token }}\n{%- if custom_tools is defined %}\n    {%- set tools = custom_tools %}\n{%- endif %}\n{%- if not tools_in_user_message is defined %}\n    {%- set tools_in_user_message = true %}\n{%- endif %}\n{%- if not date_string is defined %}\n    {%- set date_string = \"26 Jul 2024\" %}\n{%- endif %}\n{%- if not tools is defined %}\n    {%- set tools = none %}\n{%- endif %}\n\n{#- This block extracts the system message, so we can slot it into the right place. #}\n{%- if messages[0]['role'] == 'system' %}\n    {%- set system_message = messages[0]['content']|trim %}\n    {%- set messages = messages[1:] %}\n{%- else %}\n    {%- set system_message = \"\" %}\n{%- endif %}\n\n{#- System message + builtin tools #}\n{{- \"<|start_header_id|>system<|end_header_id|>\\n\\n\" }}\n{%- if builtin_tools is defined or tools is not none %}\n    {{- \"Environment: ipython\\n\" }}\n{%- endif %}\n{%- if builtin_tools is defined %}\n    {{- \"Tools: \" + builtin_tools | reject('equalto', 'code_interpreter') | join(\", \") + \"\\n\\n\"}}\n{%- endif %}\n{{- \"Cutting Knowledge Date: December 2023\\n\" }}\n{{- \"Today Date: \" + date_string + \"\\n\\n\" }}\n{%- if tools is not none and not tools_in_user_message %}\n    {{- \"You have access to the following functions. To call a function, please respond with JSON for a function call.\" }}\n    {{- 'Respond in the format {\"name\": function name, \"parameters\": dictionary of argument name and its value}.' }}\n    {{- \"Do not use variables.\\n\\n\" }}\n    {%- for t in tools %}\n        {{- t | tojson(indent=4) }}\n        {{- \"\\n\\n\" }}\n    {%- endfor %}\n{%- endif %}\n{{- system_message }}\n{{- \"<|eot_id|>\" }}\n\n{#- Custom tools are passed in a user message with some extra guidance #}\n{%- if tools_in_user_message and not tools is none %}\n    {#- Extract the first user message so we can plug it in here #}\n    {%- if messages | length != 0 %}\n        {%- set first_user_message = messages[0]['content']|trim %}\n        {%- set messages = messages[1:] %}\n    {%- else %}\n        {{- raise_exception(\"Cannot put tools in the first user message when there's no first user message!\") }}\n{%- endif %}\n    {{- '<|start_header_id|>user<|end_header_id|>\\n\\n' -}}\n    {{- \"Given the following functions, please respond with a JSON for a function call \" }}\n    {{- \"with its proper arguments that best answers the given prompt.\\n\\n\" }}\n    {{- 'Respond in the format {\"name\": function name, \"parameters\": dictionary of argument name and its value}.' }}\n    {{- \"Do not use variables.\\n\\n\" }}\n    {%- for t in tools %}\n        {{- t | tojson(indent=4) }}\n        {{- \"\\n\\n\" }}\n    {%- endfor %}\n    {{- first_user_message + \"<|eot_id|>\"}}\n{%- endif %}\n\n{%- for message in messages %}\n    {%- if not (message.role == 'ipython' or message.role == 'tool' or 'tool_calls' in message) %}\n        {{- '<|start_header_id|>' + message['role'] + '<|end_header_id|>\\n\\n'+ message['content'] | trim + '<|eot_id|>' }}\n    {%- elif 'tool_calls' in message %}\n        {%- if not message.tool_calls|length == 1 %}\n            {{- raise_exception(\"This model only supports single tool-calls at once!\") }}\n        {%- endif %}\n        {%- set tool_call = message.tool_calls[0].function %}\n        {%- if builtin_tools is defined and tool_call.name in builtin_tools %}\n            {{- '<|start_header_id|>assistant<|end_header_id|>\\n\\n' -}}\n            {{- \"<|python_tag|>\" + tool_call.name + \".call(\" }}\n            {%- for arg_name, arg_val in tool_call.arguments | items %}\n                {{- arg_name + '=\"' + arg_val + '\"' }}\n                {%- if not loop.last %}\n                    {{- \", \" }}\n                {%- endif %}\n                {%- endfor %}\n            {{- \")\" }}\n        {%- else  %}\n            {{- '<|start_header_id|>assistant<|end_header_id|>\\n\\n' -}}\n            {{- '{\"name\": \"' + tool_call.name + '\", ' }}\n            {{- '\"parameters\": ' }}\n            {{- tool_call.arguments | tojson }}\n            {{- \"}\" }}\n        {%- endif %}\n        {%- if builtin_tools is defined %}\n            {#- This means we're in ipython mode #}\n            {{- \"<|eom_id|>\" }}\n        {%- else %}\n            {{- \"<|eot_id|>\" }}\n        {%- endif %}\n    {%- elif message.role == \"tool\" or message.role == \"ipython\" %}\n        {{- \"<|start_header_id|>ipython<|end_header_id|>\\n\\n\" }}\n        {%- if message.content is mapping or message.content is iterable %}\n            {{- message.content | tojson }}\n        {%- else %}\n            {{- message.content }}\n        {%- endif %}\n        {{- \"<|eot_id|>\" }}\n    {%- endif %}\n{%- endfor %}\n{%- if add_generation_prompt %}\n    {{- '<|start_header_id|>assistant<|end_header_id|>\\n\\n' }}\n{%- endif %}\n"
}
````

### ３. **S3 へのアップロード**

```bash
export AWS_REGION=us-east-1
aws s3 mb s3://import-model-data-xxxxxxxx
aws s3 sync DeepSeek-R1-Distill-Llama-8B s3://import-model-data-xxxxxxxx/DeepSeek-R1-Distill-Llama-8B/
```

### 4. **インポートジョブの実行**

- AWS コンソールからインポートジョブを作成・実行
- 完了後、モデル ARN を取得

## Bedrock Engineer での設定

### 1. models.ts への設定追加

`src/common/models/models.ts` ファイルにカスタムモデルの定義を追加します。

```typescript
// カスタムモデルの例：DeepSeek-R1-Distill-Llama-8B
{
  baseId: 'arn:aws:bedrock:us-east-1:{{AWS_ACCOUNT_ID}}:imported-model/xxxxx',
  name: 'DeepSeek-R1-Distill-Llama-8B',
  provider: 'deepseek',
  category: 'text',
  toolUse: true,
  maxTokensLimit: 4096,
  supportsStreamingToolUse: false,
  availability: {
    base: ['us-east-1']
  }
}
```

### 2. 設定のポイント

- **baseId**: カスタムモデルの完全な ARN を指定
- **supportsStreamingToolUse**: ツール使用時のストリーミング対応状況を設定
- **availability**: モデルが利用可能なリージョンを指定

## 設定パラメータの詳細

### 必須パラメータ

| パラメータ       | 型      | 説明                    | 例                                                            |
| ---------------- | ------- | ----------------------- | ------------------------------------------------------------- |
| `baseId`         | string  | モデルの ARN            | `arn:aws:bedrock:us-east-1:123456789012:imported-model/xxxxx` |
| `name`           | string  | UI に表示されるモデル名 | `DeepSeek-R1-Distill-Llama-8B`                                |
| `provider`       | string  | モデルプロバイダー      | `deepseek`                                                    |
| `category`       | string  | モデルカテゴリー        | `text`                                                        |
| `toolUse`        | boolean | ツール使用の対応        | `true`                                                        |
| `maxTokensLimit` | number  | 最大トークン数          | `8192`                                                        |
| `availability`   | object  | 利用可能リージョン      | `{ base: ['us-east-1'] }`                                     |

### オプションパラメータ

| パラメータ                 | 型      | 説明                             | デフォルト |
| -------------------------- | ------- | -------------------------------- | ---------- |
| `supportsStreamingToolUse` | boolean | ツール使用時のストリーミング対応 | `true`     |

### supportsStreamingToolUse の重要性

このパラメータは、モデルがツール使用時にストリーミング API に対応しているかを示します：

- `true`: ストリーミング API + ツール使用が可能
- `false`: ツール使用時は非ストリーミング API（Converse API）を使用

多くのカスタムインポートモデルでは、ツール使用時のストリーミングがサポートされていないため、`false` に設定することが推奨されます。

## トラブルシューティング

### よくあるエラーと対処法

#### 1. ModelNotReadyException

**症状**: モデル呼び出し時に `Model is not ready for inference` エラー

**原因**: カスタムモデルがまだ準備中

**対処法**:

- 数分から数十分待機後に再試行
- エラーメッセージはアプリケーションの UI に表示されます

#### 2. ARN 検証エラー

**症状**: モデル ID の検証でエラーが発生

**原因**: ARN 形式のモデル ID に対する不適切な処理

**対処法**:

- Bedrock Engineer では ARN 形式の自動検出機能を実装済み
- `baseId` に完全な ARN を指定してください

#### 3. ツール使用時のストリーミングエラー

**症状**: ツール使用時にストリーミングでエラー

**原因**: モデルがツール使用時のストリーミングに非対応

**対処法**:

- `supportsStreamingToolUse: false` を設定
- 自動的に非ストリーミング API に切り替わります
