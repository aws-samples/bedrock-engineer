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

## 🔗 References

- [AWS re:Post - Adding Cost Allocation Tags to Bedrock](https://repost.aws/knowledge-center/bedrock-add-cost-allocation-tags)
- [AWS Bedrock Inference Profiles Official Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles.html)
- [AWS Cost Explorer User Guide](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ce-what-is.html)

---

This documentation enables effective use of Application Inference Profiles to manage Bedrock costs and perform detailed analysis by project and department.
