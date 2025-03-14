import useSetting from '@renderer/hooks/useSetting'
import { converse } from '@renderer/lib/api'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export const useRecommendDiagrams = () => {
  const {
    t,
    i18n: { language }
  } = useTranslation()

  // Example prompts for various diagram types
  const examplePrompts = [
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
    },
    {
      title: t('sequenceDiagramTitle', 'Sequence Diagram'),
      value: t(
        'sequenceDiagramValue',
        'Create a sequence diagram showing the interaction between a user, frontend, API service, and database during a user registration and authentication flow'
      )
    },
    {
      title: t('userStoryMapTitle', 'User Story Map'),
      value: t(
        'userStoryMapValue',
        'Design a user story map for an e-commerce mobile app showing the customer journey from product discovery to purchase completion and order tracking'
      )
    }
  ]

  const [recommendDiagrams, setRecommendDiagrams] = useState(examplePrompts)
  const [recommendLoading, setRecommendLoading] = useState(false)
  const { currentLLM: llm } = useSetting()

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
        modelId: llm.modelId,
        system: [{ text: systemPrompt }],
        messages: [{ role: 'user', content: [{ text: diagramXml }] }]
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
    setRecommendDiagrams(examplePrompts)
  }

  return {
    recommendDiagrams,
    setRecommendDiagrams,
    recommendLoading,
    getRecommendDiagrams,
    refreshRecommendDiagrams
  }
}
