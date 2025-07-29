import { chatPage } from './chat'
import { awsDiagramGenerator } from './awsDiagramGenerator'
import { stepFunctionGenerator } from './stepFunctionGenerator'
import { websiteGenerator } from './websiteGenerator'
import {
  iamPolicy,
  notificationSettings,
  bedrockSettings,
  agentSettings,
  agentToolsSettings,
  promptCacheSettings,
  tokenAnalyticsSettings,
  lightModelSettings
} from './settings'
import { thinkingMode } from './thinkingMode'
import { agentDirectory } from './agentDirectory'
import { planActMode } from './planActMode'

const HomePage = {
  'set your aws credential':
    'Set up the Amazon Bedrock configuration. Enter your AWS Credentials (region, access key, secret access key) from the settings screen.',
  'Welcome to Bedrock Engineer': 'Welcome to Bedrock Engineer',
  'This is AI assistant of software development tasks':
    'This is AI assistant of software development tasks',
  'This is AI assistant for business analysis and planning':
    'This is AI assistant for business analysis and planning',
  'This is AI assistant for content creation and documentation':
    'This is AI assistant for content creation and documentation',
  'This is AI assistant for data analysis and visualization':
    'This is AI assistant for data analysis and visualization',
  'This is AI assistant for project management and organization':
    'This is AI assistant for project management and organization',
  'This is AI assistant that helps streamline your workflow':
    'This is AI assistant that helps streamline your workflow',
  'This is AI assistant for creative problem solving':
    'This is AI assistant for creative problem solving',
  'This is AI assistant for research and information gathering':
    'This is AI assistant for research and information gathering',
  'Start by the menu on the left or': 'Start by the menu on the left or'
}

const Translation = {
  title: 'Translation',
  translating: 'Translating...',
  error: 'Error',
  retry: 'Retry',
  formality: 'Formality',
  profanity: 'Profanity Filter',
  enableTranslation: 'Enable Translation',
  targetLanguage: 'Target Language',
  sourceLanguage: 'Source Language',
  'auto-detect': 'Auto Detect',
  clearCache: 'Clear Translation Cache',
  cacheStats: 'Cache Statistics',
  translationSettings: 'Translation Settings',

  // Proxy settings
  'Auto Detect': 'Auto Detect',
  'Auto-detect system proxy when manual proxy is disabled':
    'Auto-detect system proxy when manual proxy is disabled',
  'Test Connection': 'Test Connection',
  'Testing...': 'Testing...',
  'Proxy connection successful': 'Proxy connection successful',
  'Proxy connection failed': 'Proxy connection failed',
  'Error testing proxy connection': 'Error testing proxy connection'
}

const SettingPage = {
  Setting: 'Setting',
  'Proxy Settings': 'Proxy Settings',
  'Enable Proxy': 'Enable Proxy',
  'Proxy Host': 'Proxy Host',
  Port: 'Port',
  Protocol: 'Protocol',
  'Username (optional)': 'Username (optional)',
  'Password (optional)': 'Password (optional)',
  'Enter username': 'Enter username',
  'Enter password': 'Enter password',
  'Proxy settings will be applied to both AWS SDK connections and browser sessions. Please test your configuration to ensure proper connectivity.':
    'Proxy settings will be applied to both AWS SDK connections and browser sessions. Please test your configuration to ensure proper connectivity.',
  'Proxy settings will be applied to all AWS SDK connections. Please test your configuration to ensure connectivity.':
    'Proxy settings will be applied to all AWS SDK connections. Please test your configuration to ensure connectivity.',
  'If proxy settings do not take effect, please try restarting the application.':
    'If proxy settings do not take effect, please try restarting the application.',
  'Config Directory': 'Config Directory',
  'Config Directory Description':
    'This is the directory where the application settings are stored.',
  'Project Setting': 'Project Setting',
  'Agent Chat': 'Agent Chat',
  'Tavily Search API Key': 'Tavily Search API Key',
  tavilySearchApiKeyPlaceholder: 'tvly-xxxxxxxxxxxxxxx',
  tavilySearchUrl: 'https://tavily.com/',
  'Learn more about Tavily Search, go to': 'Learn more about Tavily Search, go to',
  'Domain Settings': 'Domain Settings',
  'Quick Presets': 'Quick Presets',
  'Technical Sites': 'Technical Sites',
  'News Sites': 'News Sites',
  'Academic Sites': 'Academic Sites',
  'Exclude Social Media': 'Exclude Social Media',
  'Include Domains': 'Include Domains',
  'Exclude Domains': 'Exclude Domains',
  'Domain Settings Help':
    'Include domains to limit search to specific websites. Exclude domains to avoid certain websites. Changes are saved automatically.',
  'Learn more about domain settings at': 'Learn more about domain settings at',
  'Clear All': 'Clear All',
  'Context Length (number of messages to include in API requests)':
    'Context Length (number of messages to include in API requests)',
  minContextLength: '1',
  contextLengthPlaceholder: '10',
  'Limiting context length reduces token usage but may affect conversation continuity':
    'Limiting context length reduces token usage but may affect conversation continuity',
  'Amazon Bedrock': 'Amazon Bedrock',
  'LLM (Large Language Model)': 'LLM (Large Language Model)',
  'Inference Parameters': 'Inference Parameters',
  'Max Tokens': 'Max Tokens',
  Temperature: 'Temperature',
  topP: 'topP',
  'Advanced Setting': 'Advanced Setting',
  'When writing a message, press': 'When writing a message, press',
  to: 'to',
  'Send the message': 'Send the message',
  'Start a new line (use': 'Start a new line (use',
  'to send)': 'to send)',
  'Invalid model': 'Invalid model',
  'Complete permissions for all Bedrock Engineer features including translation and video generation':
    'Complete permissions for all Bedrock Engineer features including translation and video generation',
  'Minimal permissions for basic LLM interactions only':
    'Minimal permissions for basic LLM interactions only'
}

const StepFunctionsGeneratorPage = {
  'What kind of step functions will you create?': 'What kind of step functions will you create?',
  'Order processing workflow': 'Order processing workflow',
  '7 types of State': '7 types of State',
  'Nested Workflow': 'Nested Workflow',
  'User registration process': 'User registration process',
  'Distributed Map to process CSV in S3': 'Distributed Map to process CSV in S3',
  'Create order processing workflow': 'Create order processing workflow',
  'Please implement a workflow that combines the following seven types':
    'Please implement a workflow that combines the following seven types',
  'Create Nested Workflow example': 'Create Nested Workflow example',
  'Implement the workflow for user registration processing': `Implement the workflow for user registration processing`,
  'Use the distributed map to repeat the row of the CSV file generated in S3': `Use the distributed map to repeat the row of the CSV file generated in S3
Each line has orders and shipping information.
The distributed map processor repeats the batch of these rows and uses the Lambda function to detect the delayed order.
After that, send a message to the SQS queue for each delayed order.`
}

const SpeakPage = {
  'Nova Sonic Chat': 'Nova Sonic Chat',
  'Voice conversation with AI': 'Voice conversation with AI',
  'Voice Conversation': 'Voice Conversation',
  'Start speaking to begin the conversation': 'Start speaking to begin the conversation',
  'Ready to chat': 'Ready to chat',
  'Click "Start Speaking" to begin your voice conversation':
    'Click "Start Speaking" to begin your voice conversation',
  'Conversation in progress...': 'Conversation in progress...',
  'Conversation paused': 'Conversation paused',
  'Scroll to bottom': 'Scroll to bottom',
  'System Prompt': 'System Prompt',
  'Enter system prompt for the AI assistant...': 'Enter system prompt for the AI assistant...',
  'Disconnect to edit the system prompt': 'Disconnect to edit the system prompt',
  'This prompt will be sent when you connect to start the conversation':
    'This prompt will be sent when you connect to start the conversation',
  'Connection error. Please try reconnecting.': 'Connection error. Please try reconnecting.',
  'Reload Page': 'Reload Page',
  Disconnected: 'Disconnected',
  'Connecting...': 'Connecting...',
  Connected: 'Connected',
  Ready: 'Ready',
  'Recording...': 'Recording...',
  'Processing...': 'Processing...',
  Error: 'Error',
  Connect: 'Connect',
  Disconnect: 'Disconnect',
  'Start Speaking': 'Start Speaking',
  'Stop Speaking': 'Stop Speaking',
  Recording: 'Recording',
  Processing: 'Processing',
  Listening: 'Listening',
  Thinking: 'Thinking',
  'Listening...': 'Listening...',
  'Thinking...': 'Thinking...',
  'Edit System Prompt': 'Edit System Prompt',
  // Voice Selection
  'Select Voice': 'Select Voice',
  'Start New Chat': 'Start New Chat',
  Cancel: 'Cancel',
  Voice: 'Voice',
  // Translation Settings in Voice Modal
  'Real-time Translation': 'Real-time Translation',
  'Translate AI responses to your preferred language':
    'Translate AI responses to your preferred language',
  'Target Language': 'Target Language',
  Selected: 'Selected',
  'Translation Info': 'Translation Info',
  'Only AI responses will be translated': 'Only AI responses will be translated',
  'Translation appears below the original message':
    'Translation appears below the original message',
  'You can retry failed translations': 'You can retry failed translations',
  // Voice Descriptions
  'voice.tiffany.description': 'Warm and friendly',
  'voice.tiffany.characteristics': 'Approachable and empathetic, creates comfortable conversations',
  'voice.amy.description': 'Calm and composed',
  'voice.amy.characteristics': 'Thoughtful and measured, provides clear and balanced responses',
  'voice.matthew.description': 'Confident and authoritative',
  'voice.matthew.characteristics': 'Knowledgeable, professional, and dependable impression',
  // Sample Text
  'Try talking like this': 'Try talking like this',
  'sample.noScenarios': 'No sample conversations available',
  'Nova Sonic currently supports English only': 'Nova Sonic currently supports English only',
  // Permission Help Modal
  'permissionHelp.title': 'Resolve Duplicate Permission Dialogs',
  'permissionHelp.description': 'Information to resolve duplicate permission dialogs on macOS',
  'permissionHelp.commandTitle': 'Resolution Command',
  'permissionHelp.commandDescription':
    'If OS permission dialogs (such as microphone access) are displayed duplicately, you can resolve this issue by running the following command after building and installing the application to add an ad-hoc signature:',
  'permissionHelp.noteTitle': 'Note',
  'permissionHelp.noteDescription':
    'This command applies an ad-hoc code signature to the application and prevents the system permission dialogs from being displayed duplicately.',
  'permissionHelp.tooltip': 'Help with permission dialogs',

  // Voice Chat
  'voiceChat.regionWarning.title': 'Voice Chat Not Available',
  'voiceChat.regionWarning.message':
    'Voice Chat (Nova Sonic) is not available in the current region ({{currentRegion}}). Please switch to a supported region: {{supportedRegions}}.',
  'voiceChat.regionWarning.openSettings': 'Open Settings',
  'voiceChat.error.regionNotSupported':
    'Voice Chat is not available in the current region or there are permission issues. Please check your AWS region settings.',
  'voiceChat.error.regionConnection':
    'Failed to connect to Voice Chat service. This may be due to region compatibility issues.',
  'voiceChat.error.openSettings': 'Open Settings',

  // Settings
  'settings.novaSonic.title': 'Voice Chat (Nova Sonic)',
  'settings.novaSonic.checking': 'Checking availability...',
  'settings.novaSonic.available': 'Available',
  'settings.novaSonic.notAvailable': 'Not Available',
  'settings.novaSonic.refresh': 'Refresh status',
  'settings.novaSonic.currentRegion': 'Current region: {{region}}',
  'settings.novaSonic.supportedRegions': 'Supported regions: {{regions}}',
  'Voice Chat Status': 'Voice Chat Status'
}

const WebsiteGeneratorPage = {
  addRecommend: 'Considering additional recommended features',
  ecSiteTitle: 'EC site for plants',
  ecSiteValue: `Create the basic structure and layout of an e-commerce website that specializes in potted plants, with the following conditions:
<Conditions>
- The layout likes Amazon.com.
- The name of the e-commerce website is "Green Village".
- Use a green color theme.
- Following the previous output, add a section that displays the plants in card format.
- Following the previous output, create a function to add to the shopping cart.
- Following the previous output, create a function to check what is currently in the shopping cart and calculate the total amount.
</Conditions>`,
  ecSiteAdminTitle: 'EC site management',
  ecSiteAdminValue: `Please create an administration screen for an e-commerce site that specializes in houseplants, with the following conditions.
<Conditions>
- The name of the e-commerce site is "Green Village".
- Use a green color theme.
- There is a table that displays the most recent orders, and you can manage the status of orders, etc.
- Display dummy data
</Conditions>
Following the previous output, add a sidebar navigation`,
  healthFitnessSiteTitle: 'Health & Fitness site',
  healthFitnessSiteValue: `Create the basic structure and layout of a health and fitness website, with the following conditions:
<Conditions>
- The layout likes Amazon.com.
- The name of the website is "FitLife".
- Use a red color theme.
- Following the previous output, add a section that displays the health and fitness blogs.
- Following the previous output, create a function to search for health and fitness content based on keywords.
- Following the previous output, create a function to add comments to the blog.
</Conditions>
`,
  drawingGraphTitle: 'Drawing Graph',
  drawingGraphValue: `Please visualize the following as a graph on your website.
Purchase data CSV file
customer_id,product_id,purchase_date,purchase_amount
C001,P001,2023-04-01,50.00
C002,P002,2023-04-02,75.00
C003,P003,2023-04-03,100.00
C001,P002,2023-04-04,60.00
C002,P001, 2023-04-05,40.00
C003,P003,2023-04-06,90.00
C001,P001,2023-04-07,30.00
C002,P002,2023-04-08,80.00
C003,P001,2023-04-09,45.00
C001,P003,2023-04-10,120.00
This CSV file contains the following information:
- 'customer_id': Customer ID
- 'product_id': Product ID
- 'purchase_date': Purchase date
- 'purchase_amount': Purchase amount`,
  todoAppTitle: 'To-do app',
  todoAppValue: 'Create a simple to-do app website',
  codeTransformTitle: 'Code Transform',
  codeTransformValue: `Transform the following code:
using Android.App;
using Android.OS;
using Android.Support.V7.App;
using Android.Runtime;
using Android.Widget;
using System.Data.SQLite;
using System;
using Xamarin.Essentials;
using System.Linq;
namespace App2
{
[Activity(Label = "@string/app_name", Theme = "@style/AppTheme", MainLauncher = true)]
public class MainActivity : AppCompatActivity
{
protected override void OnCreate(Bundle savedInstanceState)
{
base.OnCreate(savedInstanceState);
Xamarin.Essentials.Platform.Init(this, savedInstanceState);
SetContentView(Resource.Layout.activity_main);
EditText input1 = FindViewById<EditText>(Resource.Id.Input1);
EditText input2 = FindViewById<EditText>(Resource.Id.Input2);
TextView total = FindViewById<TextView>(Resource.Id.Total);
Button totalButton = FindViewById<Button>(Resource.Id.TotalButton);
totalButton.Click += (sender, e) =>
{
total.Text = (int.Parse(input1.Text) + int.Parse(input2.Text)).ToString("#,0");
}
}
public override void OnRequestPermissionsResult(int requestCode, string[] permissions,
[GeneratedEnum] Android.Content.PM.Permission[] grantResults)
{
Xamarin.Essentials.Platform.OnRequestPermissionsResult(requestCode, permissions, grantResults);
base.OnRequestPermissionsResult(requestCode, permissions, grantResults);
}
}
}`
}

// New translations for MCP Server Settings tabs
const AgentFormTabs = {
  'Basic Settings': 'Basic Settings',
  'MCP Servers': 'MCP Servers',
  Tools: 'Tools',
  'MCP Server Settings': 'MCP Server Settings',
  'Configure MCP servers for this agent to use MCP tools.':
    'Configure MCP servers for this agent to use MCP tools.',
  'Register MCP servers first, then you can enable MCP tools in the Available Tools tab.':
    'Register MCP servers first, then you can enable MCP tools in the Tools tab.',
  'Add New MCP Server': 'Add New MCP Server',
  'Edit MCP Server': 'Edit MCP Server',
  'Server Configuration (JSON)': 'Server Configuration (JSON)',
  'Add Server': 'Add Server',
  'Update Server': 'Update Server',
  'Server updated successfully': 'Server updated successfully',
  'Multiple servers updated successfully': 'Multiple servers updated successfully',
  'Registered MCP Servers': 'Registered MCP Servers',
  'No MCP servers registered yet': 'No MCP servers registered yet',
  'Required fields are missing or invalid. Check the JSON format.':
    'Required fields are missing or invalid. Check the JSON format.',
  'The "env" field must be an object.': 'The "env" field must be an object.',
  'A server with this name already exists.': 'A server with this name already exists.',
  'Invalid JSON format.': 'Invalid JSON format.',
  'No valid server configurations found': 'No valid server configurations found',
  'Sample Config': 'Sample Config',
  'Export Current Config': 'Export Current Config',
  'Use claude_desktop_config.json format with mcpServers object containing server configurations.':
    'Use claude_desktop_config.json format with mcpServers object containing server configurations.',
  'Invalid format: Must use claude_desktop_config.json format with mcpServers object':
    'Invalid format: Must use claude_desktop_config.json format with mcpServers object',
  'When editing, please include exactly one server in mcpServers':
    'When editing, please include exactly one server in mcpServers',
  // Environment Context Settings
  'Environment Context Settings': 'Environment Context Settings',
  'Choose which environment context sections to include in the system prompt. Basic context (project path, date) is always included.':
    'Choose which environment context sections to include in the system prompt. Basic context (project path, date) is always included.',
  'Project Rule': 'Project Rule',
  'Includes instructions to load project-specific rules from .bedrock-engineer/rules folder':
    'Enable when working on projects with custom coding standards, architectural guidelines, or specific development practices. The AI will automatically load and follow rules from your .bedrock-engineer/rules folder to maintain consistency with your project conventions.',
  'Visual Expression Rules': 'Visual Expression Rules',
  'Includes instructions for creating diagrams, images, and mathematical formulas':
    'Enable when you need the AI to create diagrams (flowcharts, architecture diagrams), generate images, or write mathematical formulas. Useful for documentation, technical explanations, data visualization, and educational content creation.',
  'TODO List Instruction': 'TODO List Instruction',
  'Includes instructions to create TODO lists for long-running tasks':
    'Enable for complex, multi-step projects where you want the AI to break down large tasks into manageable action items. Particularly helpful for project planning, feature development, refactoring, and any work that spans multiple sessions.'
}

const CodeBlock = {
  Source: 'Source',
  Preview: 'Preview',
  'Toggle View': 'Toggle View',
  'Camera Capture': 'Camera Capture',
  'Camera Device': 'Camera Device'
}

const FileChanges = {
  original: 'Original',
  updated: 'Updated',
  added: 'Added',
  removed: 'Removed',
  noChanges: 'No changes detected',
  fileDiff: 'File Diff',
  copyOriginal: 'Copy Original',
  copyUpdated: 'Copy Updated',
  originalTextCopied: 'Original text copied to clipboard',
  updatedTextCopied: 'Updated text copied to clipboard',
  filePathCopied: 'File path copied to clipboard',
  failedToCopy: 'Failed to copy text',
  lines: 'lines',
  changed: 'Changed',
  expand: 'Expand',
  collapse: 'Collapse'
}

const BackgroundAgent = {
  title: 'Background Agent Scheduler',
  description: 'Schedule AI agents to run automatically at specified times',
  pageDescription: 'Manage scheduled tasks and configure automatic execution',
  createTask: 'Create Task',
  editTask: 'Edit Task',
  sessionContinuation: 'Session Continuation',
  continueSessionPrompt: 'Continue Session Prompt',

  // Sessions
  sessions: {
    title: 'Sessions',
    newSession: 'New Session',
    noSessions: 'No sessions',
    createNewSession: 'Create new session',
    confirmDelete: 'Are you sure you want to delete this session?',
    deleteSession: 'Delete Session'
  },

  // New Session Modal
  newSession: {
    title: 'Create New Session',
    modelSelection: 'Model Selection',
    agentSelection: 'Agent Selection',
    noAgent: 'No Agent',
    selectAgent: 'Please select an agent.',
    cancel: 'Cancel',
    create: 'Create'
  },

  // CRON Presets
  cronPresets: {
    everyMinute: 'Every minute',
    every5Minutes: 'Every 5 minutes',
    everyHour: 'Every hour',
    dailyAt9AM: 'Daily at 9 AM',
    weekdaysAt9AM: 'Weekdays at 9 AM',
    weeklyMondayAt9AM: 'Weekly on Monday at 9 AM',
    monthlyFirst9AM: 'Monthly on 1st at 9 AM'
  },

  // Help Modal
  help: {
    title: 'BackgroundAgent Creation Guide',
    subtitle: 'Best practices for creating effective BackgroundAgents',
    tooltip: 'Learn about BackgroundAgents',

    concepts: {
      title: 'Basic Concepts',
      description:
        'BackgroundAgent is designed to automate tasks suitable for scheduled execution:',
      item1: 'Ideal for tasks with clear and specific objectives',
      item2: "Automatable tasks that don't require user input",
      item3: 'Tasks that provide value through regular execution',
      item4: 'Tasks that can properly log and report results'
    },

    useCases: {
      title: 'Recommended Use Cases',
      development: {
        title: 'Development Tasks',
        description:
          'Tasks that help improve project quality. Perform static analysis of the codebase to identify unused imports and coding standard violations, or run test suites periodically to detect regressions early. You can also automate tasks that improve the productivity of the entire development team, such as checking for updates to README files and API documentation.'
      },
      maintenance: {
        title: 'Maintenance Tasks',
        description:
          'Tasks that support stable system operation. Regularly analyze application logs and error logs to detect potential problems and abnormal patterns, enabling early response. Perform periodic health checks to monitor system performance, and automate operations-related tasks such as checking data backup status and storage usage to provide peace of mind.'
      },
      workflow: {
        title: 'Workflow Support',
        description:
          'Tasks that streamline daily work operations. Check emails before business hours to extract important matters and automatically create prioritized daily work plans, or review project task boards weekly to identify incomplete tasks and items nearing deadlines. Support team productivity improvement through meeting preparation, agenda organization, and regular progress report creation.'
      },
      business: {
        title: 'Business Automation',
        description:
          'Tasks that automate routine work. Analyze customer inquiry patterns to propose FAQ updates, or regularly aggregate sales data and project metrics to update dashboards. Also helpful for management efficiency by checking team member workload and deliverable progress to create summary reports for management.'
      }
    },

    prompts: {
      title: 'Prompt Design Tips',
      description:
        'Clear and specific prompts are crucial for creating effective BackgroundAgents. Specify "what," "how," "where," and "by when," and define the expected output format (reports, summaries, checklists, etc.). Also, by clearly defining how to handle errors and the boundaries of the work scope, you can prevent unexpected behavior and achieve consistent results.'
    },

    bestPractices: {
      title: 'Best Practices',
      item1: 'Start small and improve gradually - begin with simple tasks',
      item2: 'Set clear success metrics - define what should be achieved',
      item3: 'Choose appropriate execution frequency - avoid excessive runs',
      item4: 'Utilize logs and reports - regularly review execution results'
    }
  },

  // Tabs
  tabs: {
    tasks: 'Tasks',
    stats: 'Statistics'
  },

  // Form
  form: {
    title: 'Create Scheduled Task',
    taskName: 'Task Name',
    taskNamePlaceholder: 'Enter task name...',
    schedule: 'Schedule',
    agent: 'Agent',
    selectAgent: 'Select an agent',
    model: 'Model',
    projectDirectory: 'Project Directory',
    projectDirectoryPlaceholder: 'Enter project directory path...',
    projectDirectoryHelp: 'Optional: Specify the working directory for the agent',
    selectProjectDirectory: 'Select Project Directory',
    wakeWord: 'Wake Word (Prompt)',
    wakeWordPlaceholder: 'Enter the prompt to send to the agent...',
    maxTokens: 'Max Output Tokens',
    maxTokensHelp:
      'Maximum number of tokens the model can generate (depends on the selected model)',
    wakeWordHelp: 'This message will be sent to the agent when the task runs',
    cronHelp: 'Cron expression format: minute hour day month day-of-week',
    enableTask: 'Enable task immediately',
    continueSession: 'Continue Session',
    continueSessionHelp:
      'When enabled, sends additional messages to the previous session. When disabled, always starts a new session.',
    continueSessionPrompt: 'Session Continuation Prompt',
    continueSessionPromptPlaceholder: 'Continue with the previous work...',
    continueSessionPromptHelp:
      'Dedicated prompt sent when continuing a session. If left empty, the regular wake word will be used.',

    errors: {
      nameRequired: 'Task name is required',
      cronRequired: 'Schedule is required',
      agentRequired: 'Agent selection is required',
      modelRequired: 'Model selection is required',
      wakeWordRequired: 'Wake word is required',
      invalidMaxTokens: 'Invalid max tokens value (1-64000)'
    }
  },

  // Task List
  scheduledTasks: 'Scheduled Tasks',
  noTasks: 'No Scheduled Tasks',
  noTasksDescription: 'Create your first scheduled task to get started',
  wakeWord: 'Wake Word',
  executions: 'Executions',
  lastRun: 'Last Run',
  nextRun: 'Next Run',
  created: 'Created',
  never: 'Never',

  // Task Actions
  executeManually: 'Execute Now',
  testExecution: 'Test Execution',
  enable: 'Enable',
  disable: 'Disable',
  enableTask: 'Enable task',
  disableTask: 'Disable task',
  deleteTask: 'Delete Task',
  confirmDeleteTask: 'Are you sure you want to delete this task?',
  taskDetails: 'Task Details',

  // Status
  status: {
    active: 'Active',
    disabled: 'Disabled',
    error: 'Error'
  },

  // Messages
  messages: {
    taskCreated: 'Task created successfully',
    taskUpdated: 'Task updated successfully',
    taskCancelled: 'Task deleted successfully',
    taskEnabled: 'Task enabled',
    taskDisabled: 'Task disabled',
    taskExecuted: 'Task executed successfully',
    taskExecutionFailed: 'Task execution failed',
    taskSkipped: 'Task execution skipped ({{reason}})',
    taskSkippedDuplicateExecution:
      'Task execution skipped (already running for {{executionTime}}s)',
    sessionContinued: 'Session conversation continued'
  },

  // Execution details
  executionTime: 'Execution Time',
  messagesLabel: 'Messages',
  toolExecutions: 'Tool Executions',
  error: 'Error',

  // Statistics
  stats: {
    title: 'Scheduler Statistics',
    totalTasks: 'Total Tasks',
    enabledTasks: 'Enabled Tasks',
    disabledTasks: 'Disabled Tasks',
    totalExecutions: 'Total Executions',
    tasksWithErrors: 'Tasks with Errors',
    activeCronJobs: 'Active Cron Jobs',
    healthOverview: 'Health Overview',
    executionRate: 'Execution Rate',
    successRate: 'Success Rate',
    activeRate: 'Active Rate',
    summary: 'Summary',
    active: 'Active',
    errors: 'Errors',
    disabled: 'Disabled'
  },

  lastError: 'Last Error',

  // History
  viewExecutionHistory: 'Execution History',
  history: {
    title: 'Execution History',
    viewHistory: 'Execution History',
    totalExecutions: 'Total Executions',
    successful: 'Successful',
    failed: 'Failed',
    successRate: 'Success Rate',
    filterStatus: 'Filter Status',
    filterDate: 'Filter Date',
    all: 'All',
    successOnly: 'Success Only',
    failureOnly: 'Failure Only',
    allTime: 'All Time',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    noHistory: 'No execution history',
    executionSuccess: 'Execution Success',
    executionFailure: 'Execution Failure',
    duration: 'Duration',
    messages: 'Messages',
    messageCount: 'Message Count',
    unknown: 'Unknown',
    sessionHistory: 'Session History',
    noMessages: 'No messages',
    user: 'User',
    assistant: 'Assistant',
    executionHistoryList: 'Execution History',
    executionDetails: 'Execution Details',
    sessionId: 'Session ID',
    toolExecution: 'Tool Execution',
    toolResult: 'Tool Result',
    continueConversation: 'Continue Conversation',
    showHistoryOnly: 'Show History Only',
    loadingMessages: 'Loading messages...',
    enterMessage: 'Enter your message...',
    send: 'Send',
    sendInstruction: 'Press Enter to send, Shift+Enter for new line',
    selectExecutionHistory: 'Select an execution history',
    success: 'Success',
    failure: 'Failure',
    running: 'Running'
  },

  // System Prompt
  systemPrompt: {
    title: 'System Prompt',
    show: 'Show system prompt',
    loading: 'Loading system prompt...',
    error: 'Failed to load system prompt',
    empty: 'No system prompt available'
  },

  // Table View
  table: {
    name: 'Task Name',
    schedule: 'Schedule',
    agent: 'Agent',
    status: 'Status',
    lastRun: 'Last Run',
    actions: 'Actions'
  },

  // UI Labels
  ui: {
    error: 'Error',
    continuation: 'Continue',
    executionCount: ' executions',
    lastRun: 'Last',
    details: 'Details',
    wakeWord: 'Wake Word',
    continuationPrompt: 'Continuation Prompt',
    created: 'Created'
  },

  // Error messages
  errors: {
    fetchTasks: 'Failed to load tasks',
    fetchStats: 'Failed to load statistics',
    createTask: 'Failed to create task',
    cancelTask: 'Failed to delete task',
    toggleTask: 'Failed to toggle task',
    executeTask: 'Failed to execute task',
    fetchHistory: 'Failed to load execution history',
    fetchSessionHistory: 'Failed to load session history',
    continueSession: 'Failed to continue session',
    getSystemPrompt: 'Failed to get system prompt'
  }
}

const IgnoreSettings = {
  title: 'File Exclusion Settings',
  globalTab: 'Global Settings',
  projectTab: 'Project-specific Settings',
  globalDescription: 'Configure exclusion patterns that apply across the entire application.',
  globalPlaceholder: '.git\nnode_modules\n.vscode\n*.log\n.DS_Store\n...',
  projectDescription:
    'Configure exclusion patterns that apply only to this project. Settings are saved in the .bedrock-engineer/.ignore file.',
  projectPath: 'Project Path',
  projectPlaceholder: 'node_modules\n.git\n*.log\n.DS_Store\ndist/\nbuild/\n...',
  loading: 'Loading...',
  saving: 'Saving...',
  save: 'Save',
  loadError: 'Failed to load file',
  saveError: 'Failed to save file'
}

const ProjectIgnore = {
  title: 'Project-specific Exclusion Settings',
  description:
    'Configure patterns for files and folders to ignore in this project. Settings are saved in the .bedrock-engineer/.ignore file.',
  projectPath: 'Project Path',
  placeholder: 'node_modules\n.git\n*.log\n.DS_Store\n...',
  loading: 'Loading...',
  saving: 'Saving...',
  save: 'Save',
  loadError: 'Failed to load file',
  saveError: 'Failed to save file'
}

const TodoModal = {
  'View TODO List': 'View TODO List',
  'TODO List': 'TODO List',
  'No TODO List Available': 'No TODO List Available',
  'Create a TODO list using the todoInit tool to see tasks here.':
    'Create a TODO list using the todoInit tool to see tasks here.',
  'Project Overview': 'Project Overview',
  'Overall Progress': 'Overall Progress',
  'Total Tasks': 'Total Tasks',
  Pending: 'Pending',
  'In Progress': 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
  All: 'All',
  'No tasks found for this filter.': 'No tasks found for this filter.',
  ID: 'ID',
  Created: 'Created',
  Updated: 'Updated',
  'List created on': 'List created on',
  'Last updated': 'Last updated'
}

const Common = {
  refresh: 'Refresh',
  close: 'Close',
  cancel: 'Cancel',
  create: 'Create',
  creating: 'Creating...',
  update: 'Update',
  updating: 'Updating...',
  executing: 'Executing...',
  enabled: 'Enabled',
  disabled: 'Disabled',
  minutes: 'min',
  seconds: 's'
}

const en = {
  ...HomePage,
  ...SettingPage,
  ...StepFunctionsGeneratorPage,
  ...chatPage.en,
  ...SpeakPage,
  ...FileChanges,
  ...WebsiteGeneratorPage,
  ...Translation,
  ...CodeBlock,
  ...iamPolicy.en,
  ...notificationSettings.en,
  ...bedrockSettings.en,
  ...agentSettings.en,
  ...agentToolsSettings.en,
  ...promptCacheSettings.en,
  ...tokenAnalyticsSettings.en,
  ...lightModelSettings.en,
  ...awsDiagramGenerator.en,
  ...stepFunctionGenerator.en,
  ...websiteGenerator.en,
  ...thinkingMode.en,
  ...agentDirectory.en,
  ...AgentFormTabs,
  ...planActMode.en,
  ...TodoModal,
  backgroundAgent: BackgroundAgent,
  ignoreSettings: IgnoreSettings,
  projectIgnore: ProjectIgnore,
  common: Common
}

export default en
