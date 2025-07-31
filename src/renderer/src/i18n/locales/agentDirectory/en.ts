export const en = {
  title: 'Agent Directory',
  description: 'Browse and add pre-configured agents to your collection',
  searchAgents: 'Search for agents...',

  // Agent Card
  addAgent: 'Add Agent',
  viewDetails: 'View Details',

  // Detail Modal
  authorLabel: 'Author',
  systemPromptLabel: 'System Prompt',
  toolsLabel: 'Tools',
  mcpServersLabel: 'MCP Servers',
  close: 'Close',
  scenariosLabel: 'Scenario',
  addToMyAgents: 'Add to My Agents',
  loading: 'Loading...',
  agentAddedSuccess: 'Added Successfully',
  agentAddedError: 'Error Adding Agent',

  // Loading States
  loadingAgents: 'Loading agents...',
  noAgentsFound: 'No agents found',
  retryButton: 'Retry',

  // Organization Modal
  organization: {
    editOrganization: 'Edit Organization',
    addOrganization: 'Add Organization',
    deleteOrganization: 'Delete Organization',
    organizationName: 'Organization Name',
    enterOrganizationName: 'Enter organization name',
    description: 'Description',
    enterDescription: 'Enter description',
    organizationSetupDescription:
      'Set up your organization agent sharing environment. Specify an S3 bucket to share and manage custom agents within your team.',
    s3Settings: 'S3 Settings',
    openS3Console: 'Open S3 Console ↗',
    s3Bucket: 'S3 Bucket',
    awsRegion: 'AWS Region',
    pathPrefix: 'Path Prefix',
    pathPrefixHelper: 'Optional: Organize agents in subdirectories (e.g., "team1/", "prod/")',
    saving: 'Saving...',
    update: 'Update',
    add: 'Add',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirmTitle: 'Confirm Organization Deletion',
    deleteConfirmMessage:
      'Are you sure you want to delete this organization?\nThis action cannot be undone.',
    deleteSuccess: 'Organization deleted successfully',
    deleteError: 'Error occurred while deleting',
    organizationNameRequired: 'Organization name is required',
    s3BucketRequired: 'S3 bucket is required',
    unknownError: 'Unknown error occurred',
    toast: {
      organizationAdded: '"{{name}}" has been added',
      organizationUpdated: '"{{name}}" has been updated',
      organizationDeleted: '"{{name}}" has been deleted',
      organizationError: 'Error occurred: {{error}}'
    }
  },

  // Contributor Modal
  contributor: {
    tooltip: 'Become a contributor',
    title: 'Become an Agent Directory Contributor',
    subtitle: 'Share your custom agents with the community',
    steps: 'How to contribute:',
    step1: 'Export your custom agent as a shared file',
    step2: 'Save the YAML file to this directory:',
    step3: 'Add your GitHub username as the author (recommended):',
    step4: 'Submit a Pull Request or open a GitHub issue with the YAML file attached',
    submitOptions: 'Submission Options',
    prOption: 'Via Pull Request',
    prDescription:
      'Fork the repository, add your agent file, and submit a pull request (for developers)',
    viewRepo: 'View Repository',
    issueOption: 'Via GitHub Issue',
    issueDescription: 'Use our pre-filled issue template to submit your agent (easiest method)',
    createIssue: 'Create Issue with Template',
    githubIssue: 'Submit via GitHub Issue',
    copied: 'Copied!',
    copy: 'Copy'
  }
}
