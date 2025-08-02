# Web & Search Operations

Agent Chat provides tools for searching the web and retrieving content from websites. These tools enhance the agent's capabilities by enabling access to current information and external resources.

## Available Web & Search Tools

### tavilySearch

Performs web searches using the Tavily API.

**Usage**:
- Used when current information or additional context is needed
- Searches across the web for relevant information
- Returns summarized results with source links
- Requires an API key for Tavily

**Configuration Options**:
- Search depth: Controls how comprehensive the search is
- Result count: Number of results to return
- Search type: General or technical search

**Example Query Types**:
- Technical documentation for libraries
- Latest trends or news
- Code examples and solutions
- Best practices and standards
- Version compatibility information

![Web Search Example](../../../assets/agent-chat-search.png)

### fetchWebsite

Retrieves content from specified URLs.

**Usage**:
- Retrieves content from specific web pages
- Large content is automatically split into manageable chunks
- Initial call provides chunk overview, with specific chunks retrievable as needed

**Features**:
- Supports GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS methods
- Allows custom headers and body configuration
- Handles various content types including HTML, JSON, and text
- Can extract specific elements from web pages

**HTTP Methods Supported**:
- GET: Retrieve resources
- POST: Submit data to be processed
- PUT: Update existing resources
- DELETE: Remove resources
- PATCH: Partially update resources
- HEAD: Retrieve headers only
- OPTIONS: Describe communication options

## Setup Requirements

### Tavily API Key

To use the tavilySearch tool:

1. Sign up for an account at [tavily.com](https://tavily.com)
2. Generate an API key from your dashboard
3. Configure the API key in Bedrock Engineer settings

### Network Configuration

Web & Search operations require:

- Active internet connection
- Appropriate firewall settings to allow outgoing HTTP/HTTPS connections
- Proxy configuration if operating in a restricted network environment

## Usage Strategies

### Effective Search Queries

To get the best results from web searches:

- Use specific, concise queries
- Include relevant technical terms
- Specify version numbers when applicable
- Add context keywords (e.g., "tutorial", "example", "documentation")

### Content Retrieval Best Practices

When using fetchWebsite:

- Target specific documentation pages rather than home pages
- Use URL parameters to narrow down content
- Consider authentication requirements for protected content
- Be mindful of website terms of service

## Limitations and Considerations

### Rate Limits

- Tavily API has rate limits based on your subscription plan
- Excessive requests may be throttled

### Content Access Restrictions

- Some websites block automated access
- Paywalled or login-protected content may be inaccessible
- CORS policies may restrict access to certain websites

### Data Freshness

- Web search results reflect the current state of indexed content
- Some search results may contain outdated information
- Consider verifying critical information from official sources

## Integration with Other Tools

Web & Search operations work well with:

- [File System Operations](./file-system.md) for saving retrieved information
- [Amazon Bedrock Integration](./bedrock-integration.md) for analyzing retrieved content
- [System Command & Code Execution](./system-execution.md) for processing web data

## Privacy and Security

When using Web & Search operations:

- Avoid searching for or retrieving sensitive information
- Be aware that search queries may be logged by search providers
- Consider data privacy regulations when retrieving and processing web content