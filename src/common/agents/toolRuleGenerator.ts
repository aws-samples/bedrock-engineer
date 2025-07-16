/**
 * Static class for building system prompts and environment contexts
 * Provides functional cohesion for all prompt-related generation functionality
 */
export class SystemPromptBuilder {
  /**
   * Generate basic environment context sections
   */
  private static generateBasicEnvironmentContext(): string {
    return `**<context>**

- working directory: {{projectPath}}
- date: {{date}}

**</context>**
`
  }

  /**
   * Generate TODO list instruction section
   */
  private static generateTodoListInstruction(): string {
    return `
**<todo list handling rule>**

If you expect the work will take a long time, create the following file to create a work plan and TODO list, and refer to and update it as you work. Be sure to write in detail so that you can start the same work again if the AI agent's session is interrupted.

{{projectPath}}/.bedrock-engineer/{{TASK_NAME}}_TODO.md

**</todo list handling rule>**`
  }

  /**
   * Generate project rule section
   */
  private static generateProjectRule(): string {
    return `
**<project rule>**

- If there are files under {{projectPath}}/.bedrock-engineer/rules, make sure to load them before working on them.
  This folder contains project-specific rules.

**</project rule>**
`
  }

  /**
   * Generate visual expression rules section
   */
  private static generateVisualExpressionRules(): string {
    return `
**<visual expression rule>**

If you are acting as a voice chat, please ignore this illustration rule.

- Create Mermaid.js diagrams for visual explanations (maximum 2 per response unless specified)
- If a complex diagram is required  please express it in draw.io xml format.
- Ask user permission before generating images with Stable Diffusion
- Display images using Markdown syntax: \`![image-name](url)\`
  - (example) \`![img]({{projectPath}}/generated_image.png)\`
  - (example) \`![img]({{projectPath}}/workspaces/workspace-20250529-session_1748509562336_4xe58p/generated_image.png)\`
  - Do not start with file://. Start with /.
- Use KaTeX format for mathematical formulas
- For web applications, source images from Pexels or user-specified sources

**</visual expression rule>**`
  }

  /**
   * Generate complete environment context with all sections
   */
  static async generateEnvironmentContext(contextSettings?: {
    todoListInstruction?: boolean
    projectRule?: boolean
    visualExpressionRules?: boolean
  }): Promise<string> {
    // Default settings (all enabled)
    const defaultSettings = {
      todoListInstruction: true,
      projectRule: true,
      visualExpressionRules: true
    }

    const settings = contextSettings || defaultSettings

    let context = this.generateBasicEnvironmentContext()

    // Add optional context sections based on settings
    if (settings.projectRule) {
      context += this.generateProjectRule()
    }

    if (settings.visualExpressionRules) {
      context += this.generateVisualExpressionRules()
    }

    if (settings.todoListInstruction) {
      context += this.generateTodoListInstruction()
    }

    return context
  }
}
