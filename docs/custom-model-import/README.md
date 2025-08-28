# Custom Model Import Configuration Guide

This guide explains how to configure custom models imported using Amazon Bedrock's Custom Model Import feature for use with Bedrock Engineer.

## Overview

Using Amazon Bedrock's Custom Model Import feature, you can run open-source models published on platforms like Hugging Face on Bedrock. Bedrock Engineer can be configured to use these custom imported models in its chat functionality. (Experimental: Breaking changes may be made without notice)

## Custom Model Import

### DeepSeek-R1-Distill-Llama-8B Example

### 1. **Model Download**

```bash
# Install Git LFS (for Mac)
brew install git-lfs
git lfs install

# Clone the model
git clone https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-8B
```

### 2. **tokenizer_config.json Configuration**

To use the Converse API, change the chat_template to Llama-3.1 format.
For other model types, please refer to the following documents:

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

### 3. **Upload to S3**

```bash
export AWS_REGION=us-east-1
aws s3 mb s3://import-model-data-xxxxxxxx
aws s3 sync DeepSeek-R1-Distill-Llama-8B s3://import-model-data-xxxxxxxx/DeepSeek-R1-Distill-Llama-8B/
```

### 4. **Execute Import Job**

- Create and execute an import job from the AWS console
- After completion, obtain the model ARN

## Bedrock Engineer Configuration

### 1. Adding Configuration to models.ts

Add the custom model definition to the `src/common/models/models.ts` file.

```typescript
// Custom model example: DeepSeek-R1-Distill-Llama-8B
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

### 2. Configuration Points

- **baseId**: Specify the complete ARN of the custom model
- **supportsStreamingToolUse**: Set streaming support status when using tools
- **availability**: Specify the regions where the model is available

## Configuration Parameter Details

### Required Parameters

| Parameter        | Type    | Description                | Example                                                       |
| ---------------- | ------- | -------------------------- | ------------------------------------------------------------- |
| `baseId`         | string  | Model ARN                  | `arn:aws:bedrock:us-east-1:123456789012:imported-model/xxxxx` |
| `name`           | string  | Model name displayed in UI | `DeepSeek-R1-Distill-Llama-8B`                                |
| `provider`       | string  | Model provider             | `deepseek`                                                    |
| `category`       | string  | Model category             | `text`                                                        |
| `toolUse`        | boolean | Tool usage support         | `true`                                                        |
| `maxTokensLimit` | number  | Maximum token count        | `8192`                                                        |
| `availability`   | object  | Available regions          | `{ base: ['us-east-1'] }`                                     |

### Optional Parameters

| Parameter                  | Type    | Description                        | Default |
| -------------------------- | ------- | ---------------------------------- | ------- |
| `supportsStreamingToolUse` | boolean | Streaming support when using tools | `true`  |

### Importance of supportsStreamingToolUse

This parameter indicates whether the model supports streaming API when using tools:

- `true`: Streaming API + tool usage is possible
- `false`: Use non-streaming API (Converse API) when using tools

Most custom imported models do not support streaming when using tools, so it is recommended to set this to `false`.

## Troubleshooting

### Common Errors and Solutions

#### 1. ModelNotReadyException

**Symptom**: `Model is not ready for inference` error when calling the model

**Cause**: Custom model is still being prepared

**Solution**:

- Wait a few minutes to several tens of minutes and retry
- Error messages are displayed in the application UI

#### 2. ARN Validation Error

**Symptom**: Error occurs during model ID validation

**Cause**: Improper handling of ARN format model ID

**Solution**:

- Bedrock Engineer has implemented automatic ARN format detection
- Specify the complete ARN in `baseId`

#### 3. Streaming Error When Using Tools

**Symptom**: Error occurs when streaming with tool usage

**Cause**: Model does not support streaming when using tools

**Solution**:

- Set `supportsStreamingToolUse: false`
- Automatically switches to non-streaming API
