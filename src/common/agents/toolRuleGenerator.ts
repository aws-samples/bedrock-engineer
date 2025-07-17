import { READ_ONLY_TOOLS } from '../../types/plan-mode-tools'

/**
 * Static class for building system prompts and environment contexts
 * Provides functional cohesion for all prompt-related generation functionality
 */
export class SystemPromptBuilder {
  /**
   * Generate basic environment context sections
   */
  private static generateBasicEnvironmentContext(currentMode: string): string {
    return `**<context>**

- working directory: {{projectPath}}
- date: {{date}}
- current mode: ${currentMode}

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

**</todo list handling rule>**
`
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

**</visual expression rule>**
`
  }

  /**
   * Generate ACT/PLAN mode rules section
   */
  private static generateActPlanModeRules(): string {
    const readOnlyToolsList = READ_ONLY_TOOLS.join(', ')

    return `
**<ACT MODE V.S. PLAN MODE>**

In each user message, the <context> will specify the current mode. There are two modes:

ACT MODE: In this mode, you have access to all tools except read-only tools.
In ACT MODE, you use tools to accomplish the user's task.

PLAN MODE: In this special mode, you have access to these read-only tools: ${readOnlyToolsList}.
In PLAN MODE, the goal is to gather information and get context to create a detailed plan for accomplishing the task, which the user will review and approve before they switch you to ACT MODE to implement the solution.
In PLAN mode, even if you are asked to implement something, you should analyze and research it to come up with a plan and report back to us. Never provide a full code snippet as a chat response unless explicitly instructed to do so.

**What is PLAN MODE?**
While you are usually in ACT MODE, the user may switch to PLAN MODE in order to have a back and forth with you to plan how to best accomplish the task.
When starting in PLAN MODE, depending on the user's request, you may need to do some information gathering e.g. using readFiles or tavilySearch to get more context about the task. You may also ask the user clarifying questions to get a better understanding of the task.
Once you've gained more context about the user's request, you should architect a detailed plan for how you will accomplish the task.
Then you might ask the user if they are pleased with this plan, or if they would like to make any changes. Think of this as a brainstorming session where you can discuss the task and plan the best way to accomplish it.
Finally once it seems like you've reached a good plan, ask the user to switch you back to ACT MODE to implement the solution.

**</ACT MODE V.S. PLAN MODE>**

`
  }

  /**
   * Generate complete environment context with all sections
   */
  static async generateEnvironmentContext(
    contextSettings?: {
      todoListInstruction?: boolean
      projectRule?: boolean
      visualExpressionRules?: boolean
      actPlanModeRules?: boolean
    },
    currentMode?: 'ACT MODE' | 'PLAN MODE'
  ): Promise<string> {
    // Default settings (all enabled)
    const defaultSettings = {
      todoListInstruction: true,
      projectRule: true,
      visualExpressionRules: true,
      actPlanModeRules: true
    }

    const settings = contextSettings || defaultSettings

    let context = this.generateBasicEnvironmentContext(currentMode ?? 'ACT MODE')

    // Add optional context sections based on settings
    if (settings.actPlanModeRules) {
      context += this.generateActPlanModeRules()
    }

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
