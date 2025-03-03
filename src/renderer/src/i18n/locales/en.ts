import { chatPage } from './chat'
import { awsDiagramGenerator } from './awsDiagramGenerator'
import { iamPolicy, bedrockSettings } from './settings'

const HomePage = {
  'set your aws credential':
    'Set up the Amazon Bedrock configuration. Enter your AWS Credentials (region, access key, secret access key) from the settings screen.',
  'Welcome to Bedrock Engineer': 'Welcome to Bedrock Engineer',
  'This is AI assistant of software development tasks':
    'This is AI assistant of software development tasks',
  'Start by the menu on the left or': 'Start by the menu on the left or'
}

const SettingPage = {
  Setting: 'Setting',
  'Config Directory': 'Config Directory',
  'Config Directory Description':
    'This is the directory where the application settings are stored.',
  'Project Setting': 'Project Setting',
  'Agent Chat': 'Agent Chat',
  'Tavily Search API Key': 'Tavily Search API Key',
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

const en = {
  ...HomePage,
  ...SettingPage,
  ...StepFunctionsGeneratorPage,
  ...chatPage.en,
  ...WebsiteGeneratorPage,
  ...iamPolicy.en,
  ...bedrockSettings.en,
  ...awsDiagramGenerator.en
}

export default en
