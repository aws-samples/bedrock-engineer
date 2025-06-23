# Application Inference Profile

AWS Bedrock allows you to copy specific models and inference profiles as user-managed inference profiles (hereafter referred to as "Application Inference Profiles") with custom tagging. These Application Inference Profiles enable detailed cost tracking and allocation for foundation model execution.

## 📋 Prerequisites

### AWS CLI Environment

- AWS CLI version v2.18.17 or higher is required
- AWS credentials must be properly configured

### Required IAM Permissions

To create and manage Application Inference Profiles, the following IAM permissions are required:

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

## 🚀 Creating Application Inference Profiles

### Basic Creation Command

The `copyFrom` key value should contain the ARN of a system-defined inference profile or base model.

```bash
aws bedrock create-inference-profile --region 'ap-northeast-1' \
  --inference-profile-name 'custom-bedrock-profile' \
  --description 'custom-bedrock-profile' \
  --model-source '{"copyFrom": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"}' \
  --tags '[{"key": "CostAllocateTag","value": "custom"}]'
```

### Cost Allocation Tag Examples

Examples of tags for managing costs by project or department:

```bash
# Project-based management
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

# Department-based management
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

### Verifying Creation Status

To check Application Inference Profiles, filter by inference profile type `APPLICATION`:

```bash
aws bedrock list-inference-profiles --region 'ap-northeast-1' \
  --type-equals 'APPLICATION'
```

Get detailed information for a specific profile:

```bash
aws bedrock get-inference-profile --region 'ap-northeast-1' \
  --inference-profile-identifier 'custom-bedrock-profile'
```

## 🖥️ Using Bedrock Engineer

### Enabling in Settings

1. **Open Settings Screen**

   - Select "Settings" from the menu

2. **Enable in AWS Settings Section**
   - Check the "Enable Inference Profiles" checkbox
   - Settings are automatically saved

### Identifying in Model Selection

Application Inference Profiles are distinguished from regular models by the following features:

- **🧠 Icon**: Displayed with a blue brain circuit icon (LuBrainCircuit)
- **Blue Border**: Blue border line displayed on the left side
- **"Profile" Badge**: Blue badge displayed to the right of the model name
- **Tooltip**: ARN information displayed on mouse hover

### Display Example in Model List

```
🧠 Custom Bedrock Profile [Profile]
   Application Inference Profile for cost tracking
   ARN: arn:aws:bedrock:ap-northeast-1:123456789012:inference-profile/custom-bedrock-profile
```

## 💰 Cost Management and Tracking

### Checking with AWS Cost Explorer

You can analyze costs using the created tags:

1. Access **AWS Cost Explorer**
2. Select "Tag" in **"Group by"**
3. Filter by configured tag keys (Project, Department, etc.)
4. Analyze Bedrock service costs in detail

### Setting Up Billing Alerts

Notification settings for when specific project or department costs exceed thresholds:

```bash
# CloudWatch billing alarm configuration example
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

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Cannot Create Inference Profile

**Symptoms**: Error occurs with `create-inference-profile` command

**Causes and Solutions**:

- Insufficient IAM permissions → Check the required IAM permissions above
- Region mismatch → Use a region where the base model is available
- Outdated AWS CLI version → Update to v2.18.17 or higher

#### 2. Profile Not Displayed in Bedrock Engineer

**Symptoms**: Application Inference Profiles not displayed in UI

**Solutions**:

1. Check if "Enable Inference Profiles" is enabled in settings
2. Verify AWS credentials are correctly configured
3. Confirm the profile was created in the matching region
4. Restart the application to update settings

#### 3. Costs Not Properly Allocated

**Symptoms**: Tags applied but costs not properly categorized

**Solutions**:

- Verify tags are correctly set: `list-tags-for-resource`
- Check tag activation settings in Cost Explorer
- Wait 24-48 hours for billing data updates

### Logging and Debugging

Debug information in Bedrock Engineer:

1. Open **Developer Tools** (F12 key)
2. Check inference profile-related logs in the **Console** tab
3. Identify issues from error messages

## 📚 Practical Use Cases

### Use Case-Specific Profile Configuration

```bash
# Development environment (cost-focused)
aws bedrock create-inference-profile \
  --inference-profile-name 'dev-claude-haiku' \
  --model-source '{"copyFrom": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"}' \
  --tags '[{"key": "Environment", "value": "Development"}, {"key": "CostOptimized", "value": "true"}]'

# Production environment (performance-focused)
aws bedrock create-inference-profile \
  --inference-profile-name 'prod-claude-sonnet' \
  --model-source '{"copyFrom": "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0"}' \
  --tags '[{"key": "Environment", "value": "Production"}, {"key": "HighPerformance", "value": "true"}]'
```

### Regular Cost Check Script

```bash
#!/bin/bash
# Monthly cost report generation example

echo "=== Monthly Bedrock Cost Report ==="
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE Type=TAG,Key=Project \
  --filter file://bedrock-filter.json
```

## 🔗 References

- [AWS re:Post - Adding Cost Allocation Tags to Bedrock](https://repost.aws/knowledge-center/bedrock-add-cost-allocation-tags)
- [AWS Bedrock Inference Profiles Official Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [AWS Cost Explorer User Guide](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ce-what-is.html)

---

This documentation enables effective use of Application Inference Profiles to manage Bedrock costs and perform detailed analysis by project and department.
