import { useState } from 'react'
import { awsCliOutputToDrawioXml } from '../utils/awsCliParser'

interface AwsDiagramResult {
  xml: string
  explanation: string
}

/**
 * AWS CLI実行結果からダイアグラムを生成するためのフック
 */
export function useAwsCliDiagram() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * AWS CLIを実行してリソース情報を収集し、ダイアグラムを生成する
   */
  const generateAwsDiagram = async (): Promise<AwsDiagramResult | null> => {
    setLoading(true)
    setError(null)

    try {
      // AWS CLIコマンドを実行して情報を収集
      const commands = [
        // リージョン情報を取得
        'aws ec2 describe-regions --output json',
        // EC2インスタンス情報を取得
        'aws ec2 describe-instances --output json',
        // VPC情報を取得
        'aws ec2 describe-vpcs --output json',
        // サブネット情報を取得
        'aws ec2 describe-subnets --output json',
        // セキュリティグループ情報を取得
        'aws ec2 describe-security-groups --output json',
        // S3バケット情報を取得
        'aws s3api list-buckets --output json',
        // RDSインスタンス情報を取得
        'aws rds describe-db-instances --output json',
        // Lambda関数情報を取得
        'aws lambda list-functions --output json',
        // API Gateway情報を取得
        'aws apigateway get-rest-apis --output json',
        // DynamoDBテーブル情報を取得
        'aws dynamodb list-tables --output json',
        // ELB情報を取得
        'aws elbv2 describe-load-balancers --output json'
      ]

      // コマンドを実行して結果を収集
      const results = await Promise.all(
        commands.map(async (command) => {
          try {
            const result = await window.api.executeCommand({
              command,
              cwd: process.cwd()
            })
            return result.stdout
          } catch (err) {
            console.warn(`Failed to execute command: ${command}`, err)
            return '{}'
          }
        })
      )

      // 結果を統合
      const combinedResult = results.reduce((acc, result) => {
        try {
          const data = JSON.parse(result)
          return { ...acc, ...data }
        } catch (err) {
          console.warn('Failed to parse JSON:', err)
          return acc
        }
      }, {})

      // XML形式に変換
      const xml = awsCliOutputToDrawioXml(JSON.stringify(combinedResult))

      // 説明文を生成
      const explanation = generateExplanation(combinedResult)

      setLoading(false)
      return { xml, explanation }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setLoading(false)
      return null
    }
  }

  /**
   * AWS環境の説明文を生成する
   */
  const generateExplanation = (data: any): string => {
    try {
      const regions = data.Regions?.length || 0
      const vpcs = data.Vpcs?.length || 0
      const instances =
        data.Reservations?.reduce(
          (count: number, reservation: any) => count + (reservation.Instances?.length || 0),
          0
        ) || 0
      const subnets = data.Subnets?.length || 0
      const securityGroups = data.SecurityGroups?.length || 0
      const s3Buckets = data.Buckets?.length || 0
      const rdsInstances = data.DBInstances?.length || 0
      const lambdaFunctions = data.Functions?.length || 0
      const apiGateways = data.Items?.length || 0
      const dynamodbTables = data.TableNames?.length || 0
      const loadBalancers = data.LoadBalancers?.length || 0

      return `# AWS Environment Diagram

This diagram represents the current AWS environment based on AWS CLI queries. The diagram shows the following resources:

## Resources Summary
${regions ? `- **Regions**: ${regions}` : ''}
${vpcs ? `- **VPCs**: ${vpcs}` : ''}
${instances ? `- **EC2 Instances**: ${instances}` : ''}
${subnets ? `- **Subnets**: ${subnets}` : ''}
${securityGroups ? `- **Security Groups**: ${securityGroups}` : ''}
${s3Buckets ? `- **S3 Buckets**: ${s3Buckets}` : ''}
${rdsInstances ? `- **RDS Instances**: ${rdsInstances}` : ''}
${lambdaFunctions ? `- **Lambda Functions**: ${lambdaFunctions}` : ''}
${apiGateways ? `- **API Gateways**: ${apiGateways}` : ''}
${dynamodbTables ? `- **DynamoDB Tables**: ${dynamodbTables}` : ''}
${loadBalancers ? `- **Load Balancers**: ${loadBalancers}` : ''}

## Architecture Overview
The diagram visualizes the AWS resources and their relationships. Resources are grouped by region, and connections between resources (such as EC2 instances belonging to VPCs or using security groups) are represented by lines.

## Note
This diagram was automatically generated based on the current AWS environment using AWS CLI commands. It represents a snapshot of the environment at the time of generation.
`
    } catch (err) {
      console.error('Failed to generate explanation:', err)
      return 'AWS environment diagram generated from AWS CLI commands.'
    }
  }

  return {
    loading,
    error,
    generateAwsDiagram
  }
}
