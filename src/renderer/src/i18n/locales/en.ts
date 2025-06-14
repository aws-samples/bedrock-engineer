import { chatPage } from './chat'
import { awsDiagramGenerator } from './awsDiagramGenerator'
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
  translationSettings: 'Translation Settings'
}

const SettingPage = {
  Setting: 'Setting',
  'Config Directory': 'Config Directory',
  'Config Directory Description':
    'This is the directory where the application settings are stored.',
  'Project Setting': 'Project Setting',
  'Agent Chat': 'Agent Chat',
  'Tavily Search API Key': 'Tavily Search API Key',
  tavilySearchApiKeyPlaceholder: 'tvly-xxxxxxxxxxxxxxx',
  tavilySearchUrl: 'https://tavily.com/',
  'Learn more about Tavily Search, go to': 'Learn more about Tavily Search, go to',
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
  'Invalid model': 'Invalid model'
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
  'permissionHelp.tooltip': 'Help with permission dialogs'
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

const en = {
  ...HomePage,
  ...SettingPage,
  ...StepFunctionsGeneratorPage,
  ...chatPage.en,
  ...SpeakPage,
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
  ...thinkingMode.en,
  ...agentDirectory.en,
  ...AgentFormTabs,
  ...planActMode.en
}

export default en
