# Bedrock Managed Knowledge Base Support

## Changes
- Updated `retrieve` tool to detect managed vs vector KBs and use appropriate search config
- Added managed KB detection: checks KB type before retrieval to select correct API shape
- Retrieve tool uses `managedSearchConfiguration` for MANAGED KBs, `vectorSearchConfiguration` for VECTOR
- Added `AgenticRetrieveStream` support when KB is managed and agentic retrieval enabled
- Existing VECTOR retrieve behavior unchanged

## Design
- VECTOR is the default; user opts into MANAGED via knowledgeBaseType parameter
- Retrieve tool dynamically selects search configuration based on detected KB type
- AgenticRetrieveStream for agentic retrieval with managed reranking models
- Backward compatible: VECTOR KBs detected and handled with existing logic

## API Shapes
- KB Creation: `type: MANAGED` + `managedKnowledgeBaseConfiguration.embeddingModelType: MANAGED`
- Retrieval: `managedSearchConfiguration` (not `vectorSearchConfiguration`)
- Agentic: `AgenticRetrieveStream` with `foundationModelType: MANAGED`, `rerankingModelType: MANAGED`

## Configuration
| Variable | Description | Default |
|---|---|---|
| KNOWLEDGE_BASE_TYPE | MANAGED or VECTOR | VECTOR |
| USE_AGENTIC_RETRIEVAL | Enable agentic retrieval | true |
| KNOWLEDGE_BASE_ID | KB identifier | (required) |

## SDK Requirements
- boto3 >= 1.43 for managed search and agentic retrieval
- JS SDK >= 3.750.0 for managed KB support
