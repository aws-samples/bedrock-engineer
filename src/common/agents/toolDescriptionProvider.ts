/**
 * Tool description provider interface
 * Provides detailed tool descriptions for system prompt generation
 */
export interface IToolDescriptionProvider {
  getToolDescription(toolName: string): string | Promise<string>
}
