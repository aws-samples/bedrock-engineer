import useSetting from '@renderer/hooks/useSetting'
import { converse } from '@renderer/lib/api'
import { getLightProcessingModelId } from '@renderer/lib/modelSelection'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DiagramMode } from '../components/DiagramModeSelector'

export const useRecommendDiagrams = (mode: DiagramMode = 'aws') => {
  const {
    t,
    i18n: { language }
  } = useTranslation()

  // Mode-specific example prompts
  const getExamplePromptsByMode = (mode: DiagramMode) => {
    switch (mode) {
      case 'aws':
        return [
          {
            title: t('serverlessArchitectureTitle', 'Serverless API'),
            value: t(
              'serverlessArchitectureValue',
              'Create a serverless architecture with API Gateway, Lambda, and DynamoDB for a RESTful API'
            )
          },
          {
            title: t('microservicesTitle', 'Microservices'),
            value: t(
              'microservicesValue',
              'Design a microservices architecture using ECS, API Gateway, and DynamoDB with service discovery'
            )
          },
          {
            title: t('webHostingTitle', 'Web Hosting'),
            value: t(
              'webHostingValue',
              'Create a scalable web hosting architecture with S3, CloudFront, Route 53, and WAF'
            )
          },
          {
            title: t('dataLakeTitle', 'Data Lake'),
            value: t(
              'dataLakeValue',
              'Design a data lake architecture using S3, Glue, Athena, and QuickSight for analytics'
            )
          },
          {
            title: t('containerizedAppTitle', 'Containerized App'),
            value: t(
              'containerizedAppValue',
              'Create an EKS-based containerized application architecture with load balancing and auto-scaling'
            )
          },
          {
            title: t('hybridConnectivityTitle', 'Hybrid Network'),
            value: t(
              'hybridConnectivityValue',
              'Design a hybrid connectivity architecture between on-premises and AWS using Direct Connect and VPN'
            )
          }
        ]
      case 'software-architecture':
        return [
          {
            title: t('layeredArchTitle', 'Layered Arch'),
            value: t(
              'layeredArchValue',
              'Create a layered architecture diagram showing presentation, business, data access, and database layers'
            )
          },
          {
            title: t('microservicesArchTitle', 'Microservices'),
            value: t(
              'microservicesArchValue',
              'Design a microservices architecture with API gateway, service mesh, and database per service'
            )
          },
          {
            title: t('databaseDesignTitle', 'Database Design'),
            value: t(
              'databaseDesignValue',
              'Create an Entity-Relationship diagram for an e-commerce system with users, products, and orders'
            )
          },
          {
            title: t('apiDesignTitle', 'API Design'),
            value: t(
              'apiDesignValue',
              'Design REST API architecture showing endpoints, request/response flow, and authentication'
            )
          },
          {
            title: t('eventDrivenTitle', 'Event-Driven'),
            value: t(
              'eventDrivenValue',
              'Create an event-driven architecture with message queues, event buses, and event handlers'
            )
          },
          {
            title: t('cqrsPatternTitle', 'CQRS Pattern'),
            value: t(
              'cqrsPatternValue',
              'Design CQRS and Event Sourcing architecture with command and query separation'
            )
          }
        ]
      case 'business-process':
        return [
          {
            title: t('approvalFlowTitle', 'Approval Flow'),
            value: t(
              'approvalFlowValue',
              'Create an approval workflow diagram for document review and authorization process'
            )
          },
          {
            title: t('customerJourneyTitle', 'Customer Journey'),
            value: t(
              'customerJourneyValue',
              'Design a customer journey map from awareness to purchase and post-sale support'
            )
          },
          {
            title: t('orderProcessTitle', 'Order Process'),
            value: t(
              'orderProcessValue',
              'Create an order processing workflow from order placement to delivery and payment'
            )
          },
          {
            title: t('decisionTreeTitle', 'Decision Tree'),
            value: t(
              'decisionTreeValue',
              'Design a decision-making flowchart for customer support issue resolution'
            )
          },
          {
            title: t('serviceFlowTitle', 'Service Flow'),
            value: t(
              'serviceFlowValue',
              'Create a service delivery process diagram with stakeholder interactions'
            )
          },
          {
            title: t('bpmnDiagramTitle', 'BPMN Diagram'),
            value: t(
              'bpmnDiagramValue',
              'Design a BPMN business process diagram for employee onboarding workflow'
            )
          }
        ]
      default:
        return []
    }
  }

  const [recommendDiagrams, setRecommendDiagrams] = useState(getExamplePromptsByMode(mode))
  const [recommendLoading, setRecommendLoading] = useState(false)
  const { currentLLM: llm, lightProcessingModel } = useSetting()

  // モード変更時にレコメンデーションを自動更新
  useEffect(() => {
    setRecommendDiagrams(getExamplePromptsByMode(mode))
  }, [mode, t])

  // Function to get diagram recommendations based on the current diagram XML
  const getRecommendDiagrams = async (diagramXml: string) => {
    let retry = 0
    if (retry > 3) {
      return
    }

    setRecommendLoading(true)

    const systemPrompt = `You are an AI assistant that recommends improvements and variations for diagrams.
Create your answer according to the given rules and schema.

<rules>
- Answers in formats other than those described in the <schema></schema> below are strictly prohibited.
- Please provide at least three and up to six recommended improvements or variations.
- If in case of AWS, focus on AWS architecture best practices, scalability, security, and cost optimization.
- Keep recommendations concise but descriptive.
</rules>

The output format must be a JSON array as shown below. Any other format should not be used. This is an absolute rule.
!Important: Never output any text before or after the JSON array.

The title property should contain a short phrase (10 characters or less) expressing the recommended diagram type.
The value property should contain a detailed description of what to create. This should be in the form of an instruction.

<schema>
[
  {
    "title": "Add Backup",
    "value": "Add AWS Backup service to protect data in DynamoDB and S3 with scheduled backup plans"
  },
  {
    "title": "Multi-AZ",
    "value": "Modify the architecture to be highly available by deploying resources across multiple Availability Zones"
  }
]
</schema>

!Important: JSON keys should not be in any language other than English.
!Important: Respond in the following languages: ${language}.`

    try {
      const result = await converse({
        modelId: getLightProcessingModelId(llm, lightProcessingModel),
        system: [{ text: systemPrompt }],
        messages: [{ role: 'user', content: [{ text: diagramXml }] }],
        inferenceConfig: {
          maxTokens: 4096,
          temperature: 0.5
        }
      })

      const recommendDiagrams = result.output.message?.content[0]?.text

      if (recommendDiagrams) {
        try {
          const json = JSON.parse(recommendDiagrams)
          setRecommendDiagrams(json)
        } catch (e) {
          console.log('Error parsing recommendations:', e)
          retry += 1
          return getRecommendDiagrams(diagramXml)
        }
      }
    } catch (e) {
      console.error('Error getting recommendations:', e)
    } finally {
      setRecommendLoading(false)
    }
  }

  const refreshRecommendDiagrams = () => {
    setRecommendDiagrams(getExamplePromptsByMode(mode))
  }

  return {
    recommendDiagrams,
    setRecommendDiagrams,
    recommendLoading,
    getRecommendDiagrams,
    refreshRecommendDiagrams
  }
}
