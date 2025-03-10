/**
 * AWS CLI出力をパースして構成情報を抽出するユーティリティ
 */

interface AwsResource {
  type: string
  id: string
  name?: string
  properties: Record<string, any>
  region?: string
}

interface AwsConnection {
  source: string
  target: string
  type: string
  properties?: Record<string, any>
}

interface AwsEnvironment {
  resources: AwsResource[]
  connections: AwsConnection[]
  regions: string[]
}

/**
 * AWS CLI出力を解析して環境情報を抽出する
 * @param cliOutput AWS CLIコマンドの出力
 * @returns 構造化されたAWS環境情報
 */
export function parseAwsCliOutput(cliOutput: string): AwsEnvironment {
  const environment: AwsEnvironment = {
    resources: [],
    connections: [],
    regions: []
  }

  try {
    // JSON形式の出力をパース
    const data = JSON.parse(cliOutput)

    // リージョン情報の抽出
    if (data.Regions) {
      environment.regions = data.Regions.map((region: any) => region.RegionName)
    }

    // EC2インスタンスの抽出
    if (data.Reservations) {
      data.Reservations.forEach((reservation: any) => {
        if (reservation.Instances) {
          reservation.Instances.forEach((instance: any) => {
            const resource: AwsResource = {
              type: 'EC2',
              id: instance.InstanceId,
              name:
                instance.Tags?.find((tag: any) => tag.Key === 'Name')?.Value || instance.InstanceId,
              properties: {
                state: instance.State?.Name,
                instanceType: instance.InstanceType,
                privateIp: instance.PrivateIpAddress,
                publicIp: instance.PublicIpAddress,
                vpcId: instance.VpcId,
                subnetId: instance.SubnetId,
                securityGroups: instance.SecurityGroups?.map((sg: any) => sg.GroupId) || []
              },
              region: instance.Placement?.AvailabilityZone?.slice(0, -1)
            }
            environment.resources.push(resource)

            // VPCとの接続を追加
            if (instance.VpcId) {
              environment.connections.push({
                source: instance.InstanceId,
                target: instance.VpcId,
                type: 'belongs-to'
              })
            }

            // サブネットとの接続を追加
            if (instance.SubnetId) {
              environment.connections.push({
                source: instance.InstanceId,
                target: instance.SubnetId,
                type: 'belongs-to'
              })
            }

            // セキュリティグループとの接続を追加
            instance.SecurityGroups?.forEach((sg: any) => {
              environment.connections.push({
                source: instance.InstanceId,
                target: sg.GroupId,
                type: 'uses'
              })
            })
          })
        }
      })
    }

    // VPCの抽出
    if (data.Vpcs) {
      data.Vpcs.forEach((vpc: any) => {
        const resource: AwsResource = {
          type: 'VPC',
          id: vpc.VpcId,
          name: vpc.Tags?.find((tag: any) => tag.Key === 'Name')?.Value || vpc.VpcId,
          properties: {
            cidrBlock: vpc.CidrBlock,
            isDefault: vpc.IsDefault
          },
          region: vpc.Region
        }
        environment.resources.push(resource)
      })
    }

    // サブネットの抽出
    if (data.Subnets) {
      data.Subnets.forEach((subnet: any) => {
        const resource: AwsResource = {
          type: 'Subnet',
          id: subnet.SubnetId,
          name: subnet.Tags?.find((tag: any) => tag.Key === 'Name')?.Value || subnet.SubnetId,
          properties: {
            cidrBlock: subnet.CidrBlock,
            availabilityZone: subnet.AvailabilityZone
          },
          region: subnet.AvailabilityZone?.slice(0, -1)
        }
        environment.resources.push(resource)

        // VPCとの接続を追加
        if (subnet.VpcId) {
          environment.connections.push({
            source: subnet.SubnetId,
            target: subnet.VpcId,
            type: 'belongs-to'
          })
        }
      })
    }

    // セキュリティグループの抽出
    if (data.SecurityGroups) {
      data.SecurityGroups.forEach((sg: any) => {
        const resource: AwsResource = {
          type: 'SecurityGroup',
          id: sg.GroupId,
          name: sg.GroupName,
          properties: {
            description: sg.Description,
            ingressRules: sg.IpPermissions?.length || 0,
            egressRules: sg.IpPermissionsEgress?.length || 0
          },
          region: sg.Region
        }
        environment.resources.push(resource)

        // VPCとの接続を追加
        if (sg.VpcId) {
          environment.connections.push({
            source: sg.GroupId,
            target: sg.VpcId,
            type: 'belongs-to'
          })
        }
      })
    }

    // S3バケットの抽出
    if (data.Buckets) {
      data.Buckets.forEach((bucket: any) => {
        const resource: AwsResource = {
          type: 'S3',
          id: bucket.Name,
          name: bucket.Name,
          properties: {
            creationDate: bucket.CreationDate
          }
        }
        environment.resources.push(resource)
      })
    }

    // RDSインスタンスの抽出
    if (data.DBInstances) {
      data.DBInstances.forEach((db: any) => {
        const resource: AwsResource = {
          type: 'RDS',
          id: db.DBInstanceIdentifier,
          name: db.DBInstanceIdentifier,
          properties: {
            engine: db.Engine,
            status: db.DBInstanceStatus,
            endpoint: db.Endpoint?.Address,
            port: db.Endpoint?.Port,
            multiAZ: db.MultiAZ
          },
          region: db.AvailabilityZone?.slice(0, -1)
        }
        environment.resources.push(resource)

        // VPCとの接続を追加
        if (db.DBSubnetGroup?.VpcId) {
          environment.connections.push({
            source: db.DBInstanceIdentifier,
            target: db.DBSubnetGroup.VpcId,
            type: 'belongs-to'
          })
        }

        // セキュリティグループとの接続を追加
        db.VpcSecurityGroups?.forEach((sg: any) => {
          environment.connections.push({
            source: db.DBInstanceIdentifier,
            target: sg.VpcSecurityGroupId,
            type: 'uses'
          })
        })
      })
    }

    // Lambda関数の抽出
    if (data.Functions) {
      data.Functions.forEach((func: any) => {
        const resource: AwsResource = {
          type: 'Lambda',
          id: func.FunctionName,
          name: func.FunctionName,
          properties: {
            runtime: func.Runtime,
            memorySize: func.MemorySize,
            timeout: func.Timeout,
            lastModified: func.LastModified
          },
          region: func.Region
        }
        environment.resources.push(resource)

        // VPCとの接続を追加
        if (func.VpcConfig?.VpcId) {
          environment.connections.push({
            source: func.FunctionName,
            target: func.VpcConfig.VpcId,
            type: 'belongs-to'
          })
        }

        // サブネットとの接続を追加
        func.VpcConfig?.SubnetIds?.forEach((subnetId: string) => {
          environment.connections.push({
            source: func.FunctionName,
            target: subnetId,
            type: 'uses'
          })
        })

        // セキュリティグループとの接続を追加
        func.VpcConfig?.SecurityGroupIds?.forEach((sgId: string) => {
          environment.connections.push({
            source: func.FunctionName,
            target: sgId,
            type: 'uses'
          })
        })
      })
    }

    // API Gatewayの抽出
    if (data.Items) {
      data.Items.forEach((api: any) => {
        if (api.name) {
          // API Gatewayの特徴
          const resource: AwsResource = {
            type: 'ApiGateway',
            id: api.id,
            name: api.name,
            properties: {
              description: api.description,
              createdDate: api.createdDate,
              version: api.version
            },
            region: api.Region
          }
          environment.resources.push(resource)
        }
      })
    }

    // DynamoDBテーブルの抽出
    if (data.TableNames) {
      data.TableNames.forEach((tableName: string) => {
        const resource: AwsResource = {
          type: 'DynamoDB',
          id: tableName,
          name: tableName,
          properties: {},
          region: data.Region
        }
        environment.resources.push(resource)
      })
    }

    // ELBの抽出
    if (data.LoadBalancers) {
      data.LoadBalancers.forEach((lb: any) => {
        const isApplicationLB = lb.Type === 'application'
        const resource: AwsResource = {
          type: isApplicationLB ? 'ALB' : 'ELB',
          id: lb.LoadBalancerArn || lb.LoadBalancerName,
          name: lb.LoadBalancerName,
          properties: {
            dnsName: lb.DNSName,
            scheme: lb.Scheme,
            type: lb.Type,
            state: lb.State?.Code
          },
          region: lb.AvailabilityZones?.[0]?.ZoneName?.slice(0, -1)
        }
        environment.resources.push(resource)

        // VPCとの接続を追加
        if (lb.VpcId) {
          environment.connections.push({
            source: lb.LoadBalancerArn || lb.LoadBalancerName,
            target: lb.VpcId,
            type: 'belongs-to'
          })
        }

        // サブネットとの接続を追加
        lb.AvailabilityZones?.forEach((az: any) => {
          if (az.SubnetId) {
            environment.connections.push({
              source: lb.LoadBalancerArn || lb.LoadBalancerName,
              target: az.SubnetId,
              type: 'uses'
            })
          }
        })

        // セキュリティグループとの接続を追加
        lb.SecurityGroups?.forEach((sgId: string) => {
          environment.connections.push({
            source: lb.LoadBalancerArn || lb.LoadBalancerName,
            target: sgId,
            type: 'uses'
          })
        })
      })
    }
  } catch (error) {
    console.error('Failed to parse AWS CLI output:', error)
  }

  return environment
}

/**
 * AWS環境情報をDrawIO XML形式に変換する
 * @param environment AWS環境情報
 * @returns DrawIO XML形式の文字列
 */
export function convertToDrawioXml(environment: AwsEnvironment): string {
  // リソースのタイプごとのDrawIO形状とアイコン情報
  const resourceShapes: Record<string, { shape: string; icon: string }> = {
    EC2: {
      shape: 'mxgraph.aws4.resourceIcon',
      icon: 'mxgraph.aws4.ec2'
    },
    VPC: {
      shape: 'mxgraph.aws4.group',
      icon: 'mxgraph.aws4.group_vpc'
    },
    Subnet: {
      shape: 'mxgraph.aws4.group',
      icon: 'mxgraph.aws4.group_security_group'
    },
    SecurityGroup: {
      shape: 'mxgraph.aws4.group',
      icon: 'mxgraph.aws4.security_group'
    },
    S3: {
      shape: 'mxgraph.aws4.resourceIcon',
      icon: 'mxgraph.aws4.s3'
    },
    RDS: {
      shape: 'mxgraph.aws4.resourceIcon',
      icon: 'mxgraph.aws4.rds'
    },
    Lambda: {
      shape: 'mxgraph.aws4.resourceIcon',
      icon: 'mxgraph.aws4.lambda'
    },
    ApiGateway: {
      shape: 'mxgraph.aws4.resourceIcon',
      icon: 'mxgraph.aws4.api_gateway'
    },
    DynamoDB: {
      shape: 'mxgraph.aws4.resourceIcon',
      icon: 'mxgraph.aws4.dynamodb'
    },
    ALB: {
      shape: 'mxgraph.aws4.resourceIcon',
      icon: 'mxgraph.aws4.application_load_balancer'
    },
    ELB: {
      shape: 'mxgraph.aws4.resourceIcon',
      icon: 'mxgraph.aws4.elastic_load_balancing'
    }
  }

  // リソースの配置位置を計算
  const resourcePositions: Record<string, { x: number; y: number }> = {}
  const gridSize = 150
  const regionSpacing = 400

  // リージョンごとにリソースをグループ化
  const resourcesByRegion: Record<string, AwsResource[]> = {}
  environment.resources.forEach((resource) => {
    const region = resource.region || 'global'
    if (!resourcesByRegion[region]) {
      resourcesByRegion[region] = []
    }
    resourcesByRegion[region].push(resource)
  })

  // リージョンごとにリソースの位置を計算
  let regionIndex = 0
  Object.entries(resourcesByRegion).forEach(([, resources]) => {
    const regionX = 200 + regionIndex * regionSpacing
    let resourceIndex = 0

    // VPCを先に配置
    const vpcs = resources.filter((r) => r.type === 'VPC')
    vpcs.forEach((vpc) => {
      resourcePositions[vpc.id] = {
        x: regionX,
        y: 200 + resourceIndex * gridSize
      }
      resourceIndex++
    })

    // その他のリソースを配置
    resources
      .filter((r) => r.type !== 'VPC')
      .forEach((resource) => {
        resourcePositions[resource.id] = {
          x: regionX + 150,
          y: 200 + resourceIndex * gridSize
        }
        resourceIndex++
      })

    regionIndex++
  })

  // XML生成
  let cellId = 1
  let xml = `<mxfile host="Electron" modified="${new Date().toISOString()}" agent="AWS CLI Diagram Generator" etag="aws-cli-diagram" version="21.6.5" type="device">
  <diagram name="AWS Environment" id="aws-environment">
    <mxGraphModel dx="1194" dy="824" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="aws-cloud" value="AWS Cloud" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;" parent="1" vertex="1">
          <mxGeometry x="100" y="100" width="${Object.keys(resourcesByRegion).length * regionSpacing + 200}" height="600" as="geometry" />
        </mxCell>`

  // リージョンを追加
  Object.keys(resourcesByRegion).forEach((region, index) => {
    if (region !== 'global') {
      const regionX = 150 + index * regionSpacing
      xml += `
        <mxCell id="region-${region}" value="${region}" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region;strokeColor=#147EBA;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#147EBA;dashed=1;" parent="aws-cloud" vertex="1">
          <mxGeometry x="${regionX}" y="50" width="350" height="500" as="geometry" />
        </mxCell>`
    }
  })

  // リソースを追加
  environment.resources.forEach((resource) => {
    const position = resourcePositions[resource.id] || { x: 100, y: 100 }
    const shapeInfo = resourceShapes[resource.type] || { shape: 'rectangle', icon: '' }
    const parentId =
      resource.region && resource.region !== 'global' ? `region-${resource.region}` : 'aws-cloud'

    // VPCの場合は特別な処理
    if (resource.type === 'VPC') {
      xml += `
        <mxCell id="${resource.id}" value="${resource.name || resource.id}" style="points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;shape=${shapeInfo.shape};grIcon=${shapeInfo.icon};strokeColor=#248814;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#AAB7B8;dashed=0;" parent="${parentId}" vertex="1">
          <mxGeometry x="20" y="50" width="300" height="400" as="geometry" />
        </mxCell>`
    } else {
      // 通常のリソース
      xml += `
        <mxCell id="${resource.id}" value="${resource.name || resource.id}" style="sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=#F78E04;gradientDirection=north;fillColor=#D05C17;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;shape=${shapeInfo.shape};resIcon=${shapeInfo.icon};" parent="${parentId}" vertex="1">
          <mxGeometry x="${position.x}" y="${position.y}" width="78" height="78" as="geometry" />
        </mxCell>`
    }

    cellId++
  })

  // 接続を追加
  environment.connections.forEach((connection) => {
    xml += `
        <mxCell id="conn-${cellId}" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" parent="aws-cloud" source="${connection.source}" target="${connection.target}" edge="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>`
    cellId++
  })

  // XMLを閉じる
  xml += `
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`

  return xml
}

/**
 * AWS CLI実行結果をDrawIO XML形式に変換する
 * @param cliOutput AWS CLIコマンドの出力
 * @returns DrawIO XML形式の文字列
 */
export function awsCliOutputToDrawioXml(cliOutput: string): string {
  const environment = parseAwsCliOutput(cliOutput)
  return convertToDrawioXml(environment)
}
