/**
 * AWS関連要素の検出ユーティリティ
 */

/**
 * XMLとexplanationからAWS関連の要素を検出する
 * @param xml - draw.ioのXMLコンテンツ
 * @param explanation - ダイアグラムの説明文
 * @returns AWS関連要素が含まれている場合はtrue
 */
export const detectAWSElements = (xml: string, explanation: string): boolean => {
  // XMLからAWSアイコンを検出
  const awsIconPatterns = /mxgraph\.aws4\.|aws-|amazon-/i
  const hasAWSIcons = awsIconPatterns.test(xml)

  // 説明文からAWSキーワードを検出
  const awsKeywords =
    /aws|amazon|lambda|s3|dynamodb|ec2|rds|api gateway|cloudwatch|vpc|iam|sns|sqs|cloudformation|elastic load balancer|aurora|redshift|kinesis|glue|step functions|eventbridge|cognito|amplify|appsync|cloudfront|route53|elastic beanstalk|ecs|eks|fargate|batch|emr|sagemaker|comprehend|textract|rekognition|polly|transcribe|translate|lex|connect|pinpoint|ses|workspaces|appstream|worklink|workdocs|chime|honeycode|braket|quantum|ground station|satellite|outposts|wavelength|local zones|snow family|datasync|transfer family|direct connect|transit gateway|nat gateway|internet gateway|elastic ip|load balancer|auto scaling|cloudtrail|config|systems manager|secrets manager|parameter store|certificate manager|kms|hsm|waf|shield|guardduty|inspector|macie|security hub|detective|access analyzer|artifact|audit manager|backup|disaster recovery|elastic disaster recovery|application recovery controller|resilience hub|fault injection simulator|x-ray|cloudwatch synthetics|application insights|devops guru|codeguru|codewhisperer|codebuild|codedeploy|codepipeline|codecommit|codestar|cloud9|cloudshell|application composer|copilot|proton|well-architected tool|trusted advisor|support|personal health dashboard|service quotas|license manager|control tower|organizations|single sign-on|identity center|resource access manager|resource groups|tag editor|cost explorer|budgets|cost and usage report|reserved instances|savings plans|compute optimizer|migration hub|application migration service|database migration service|server migration service|mainframe modernization|application discovery service/i
  const hasAWSKeywords = awsKeywords.test(explanation)

  return hasAWSIcons || hasAWSKeywords
}

/**
 * AWS CDK変換用のプロンプトを生成する
 * @param xml - draw.ioのXMLコンテンツ (将来的に使用予定)
 * @param explanation - ダイアグラムの説明文
 * @returns 生成されたプロンプト
 */
export const generateCDKPrompt = (xml: string, explanation: string): string => {
  return `Convert the following AWS architecture diagram into TypeScript code for AWS CDK:

Architecture description:
${explanation}

Requirements:
- Use AWS CDK v2
- Implement in TypeScript
- Follow best practices
- Include appropriate IAM role and policy configuration
- Parameterize using environment variables
- Use consistent tagging and resource naming conventions
- Include security groups and network configuration
- Output as a complete CDK project ready to deploy

Draw.io XML file:
${xml}

`
}
