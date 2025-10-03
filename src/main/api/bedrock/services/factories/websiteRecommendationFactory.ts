import { JSONSchema } from '../../types/structured-output'

export interface RecommendationItem {
  title: string
  value: string
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[]
}

/**
 * Factory for creating website recommendation requests
 * Encapsulates the schema and prompt logic for website improvements
 */
export class WebsiteRecommendationFactory {
  /**
   * Create a structured output request for website recommendations
   * @param params - Parameters including website code and language
   * @returns Request configuration for structured output service
   */
  static createRequest(params: { websiteCode: string; language: string }) {
    return {
      systemPrompt: this.buildSystemPrompt(params.language),
      userMessage: params.websiteCode,
      outputSchema: this.getOutputSchema(),
      toolOptions: {
        name: 'recommend_website_changes',
        description: 'Generate recommendations for website improvements based on code analysis'
      },
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.5
      }
    }
  }

  /**
   * Get the JSON schema for website recommendation output
   * @returns JSON schema defining the structure of recommendations
   */
  static getOutputSchema(): JSONSchema {
    return {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          description: 'List of recommended changes for website improvement',
          items: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Short title summarizing the recommendation (max 10 characters)'
              },
              value: {
                type: 'string',
                description:
                  'Detailed recommendation in instruction form (e.g., "add ~", "change to ~")'
              }
            },
            required: ['title', 'value']
          },
          minItems: 2,
          maxItems: 5
        }
      },
      required: ['recommendations']
    }
  }

  /**
   * Build the system prompt for website recommendations
   * @param language - The language for the response
   * @returns System prompt text
   */
  static buildSystemPrompt(language: string): string {
    return `You are an AI assistant specializing in web UI/UX improvements.
Analyze the provided website code and provide actionable recommendations using the 'recommend_website_changes' tool.

Focus on:
- User experience improvements
- Accessibility enhancements
- Performance optimizations
- Visual design improvements
- Navigation simplification
- Content clarity

Guidelines:
- Provide at least 2 and up to 5 recommendations
- Each recommendation should have a concise title (max 10 characters)
- Each recommendation should include detailed improvement instructions
- Format recommendations as actionable directives (e.g., "Add ~", "Change to ~")
- Prioritize UI/UX improvements that directly benefit users

Respond in: ${language}`
  }
}
