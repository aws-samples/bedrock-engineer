export const diagramPrompt = `If you create AWS Diagram in Mermaid.js format:
    - Unless otherwise specified, display it in chat without writing it to a file.
    - Use the correct syntax for each component
    - Ensure logical connections between services
    - Use appropriate icons and labels
    - Organize related services into groups when applicable
    - Use junctions when necessary for complex connections
    - Remember to follow Mermaid.js syntax rules and structure the diagram clearly and logically.
    <rule>
    Components:
    - Services (nodes)
    - Edges (connections between services)
    - Groups (for organizing related services)
    Syntax:
    - Begin with "architecture-beta"
    - Groups:
      - !Important Rule: NEVER use "end". DO NOT nest. There is no "end" syntax, groups must be on a single line and may not be nested.
      - The syntax for declaring a group is:
        group {group id}({icon name})[{title}] (in {parent id})?
      - Put together:
        group public_api(cloud)[Public API]
      - creates a group identified as public_api, uses the icon cloud, and has the label Public API.
        Additionally, groups can be placed within a group using the optional in keyword
        group private_api(cloud)[Private API] in public_api
      - <example>
        service server[Server] in groupOne
        service subnet[Subnet] in groupTwo

        server{group}:B --> T:subnet{group}
        </example>
    - Services: service {service id}({icon name})[{title}] (in {parent id})?
    - Edges: {serviceId}{{group}}?:{T|B|L|R} {<}?--{>}? {T|B|L|R}:{serviceId}{{group}}?
    - Junctions: junction {junction id} (in {parent id})?
    Icons and Labels:
    - Icons: Surround icon name with ()
    - Labels: Surround text with []
    - The available icons are: ["amazon-chime","amazon-connect","aws","aws-amplify","aws-api-gateway","aws-app-mesh","aws-appflow","aws-appsync","aws-athena","aws-aurora","aws-backup","aws-batch","aws-certificate-manager","aws-cloudformation","aws-cloudfront","aws-cloudsearch","aws-cloudtrail","aws-cloudwatch","aws-codebuild","aws-codecommit","aws-codedeploy","aws-codepipeline","aws-codestar","aws-cognito","aws-config","aws-documentdb","aws-dynamodb","aws-ec2","aws-ecs","aws-eks","aws-elastic-beanstalk","aws-elastic-cache","aws-elasticache","aws-elb","aws-eventbridge","aws-fargate","aws-glacier","aws-glue","aws-iam","aws-keyspaces","aws-kinesis","aws-kms","aws-lake-formation","aws-lambda","aws-lightsail","aws-mobilehub","aws-mq","aws-msk","aws-neptune","aws-open-search","aws-opsworks","aws-quicksight","aws-rds","aws-redshift","aws-route53","aws-s3","aws-secrets-manager","aws-ses","aws-shield","aws-sns","aws-sqs","aws-step-functions","aws-systems-manager","aws-timestream","aws-vpc","aws-waf","aws-xray"]
    Edge Direction:
    - Specify with T (Top), B (Bottom), L (Left), R (Right)
    - Example: db:R -- L:server
    Arrows:
    - Add < or > to indicate direction
    - Example: subnet:R --> L:gateway
    Group Connections:
    - Use {group} modifier for edges between groups
    - Example: server{group}:B --> T:subnet{group}
    Junctions:
    - Special nodes for 4-way splits between edges
    - When asked to create or interpret an architecture diagram:
    </rule>

    <example>
    architecture-beta
        group api(logos:aws-lambda)[API]

        service db(logos:aws-aurora)[Database] in api
        service disk1(logos:aws-glacier)[Storage] in api
        service disk2(logos:aws-s3)[Storage] in api
        service server(logos:aws-ec2)[Server] in api

        db:L -- R:server
        disk1:T -- B:server
        disk2:T -- B:db
   </example>

   The following is a nested expression, and also has an end notation. This will not work:
   <bad-example>
   architecture-beta
    group vpc(aws-vpc)[VPC]
        group az1(aws)[Availability Zone 1]
            group public1(aws)[Public Subnet AZ1]
                service alb(aws-elb)[Application Load Balancer]
            end
            group private1(aws)[Private Subnet AZ1]
                service ec2_1(aws-ec2)[EC2 Instance 1]
                service rds_1(aws-rds)[RDS Primary]
            end
        end
        group az2(aws)[Availability Zone 2]
            group public2(aws)[Public Subnet AZ2]
            end
            group private2(aws)[Private Subnet AZ2]
                service ec2_2(aws-ec2)[EC2 Instance 2]
                service rds_2(aws-rds)[RDS Standby]
            end
        end
    end
    </bad-example>`
