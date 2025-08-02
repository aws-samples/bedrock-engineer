# System Command & Code Execution

Agent Chat provides powerful tools for executing system commands and running code. These tools extend the agent's capabilities beyond conversation, allowing it to interact with the operating system and execute various programming languages.

## Available System & Code Execution Tools

### executeCommand

Manages command execution and process input handling.

**Operational Modes**:
1. **New Process Initiation**: Start a new process with command and working directory specification
2. **Input to Existing Process**: Send standard input to existing processes using process ID

**Security Features**:
- Only allowed commands can be executed
- Uses the configured shell
- Unregistered commands cannot be executed

**Extension Capabilities**:
The agent's capabilities can be extended by registering commands that:
- Connect to databases
- Execute APIs
- Invoke other AI agents

**Configuration Options**:
- Allowed commands whitelist
- Default working directory
- Command timeout settings
- Shell selection

### codeInterpreter

Executes Python code in a secure Docker environment with pre-installed data science libraries.

**Key Features**:
- Isolated code execution with no internet access for security
- Pre-installed data science libraries
- Input files can be mounted read-only at /data/ directory
- Generated files are automatically detected and reported

**Supported Environments**:
1. **Basic**: Includes essential libraries:
   - numpy
   - pandas
   - matplotlib
   - requests

2. **Datascience**: Full ML stack including:
   - scikit-learn
   - scipy
   - seaborn
   - tensorflow
   - pytorch
   - and more

**Use Cases**:
- Data analysis and visualization
- Machine learning experimentation
- File format conversion
- Custom data processing

### screenCapture

Captures the current screen and saves as PNG image file.

**Features**:
- Creates screenshot of current display
- Optionally analyzes captured images with AI using vision models (Claude/Nova)
- Extracts text content from screenshots
- Identifies UI elements
- Provides detailed visual descriptions
- Supports debugging and documentation

**Requirements**:
- Platform-specific permissions required
- For macOS: Screen Recording permission in System Preferences required

### cameraCapture

Captures images from PC camera using HTML5 getUserMedia API.

**Features**:
- Saves captured images as files
- Supports different quality settings (low, medium, high)
- Outputs in different formats (JPG, PNG)
- Optional AI analysis of captured images
- Text content extraction
- Object identification
- Detailed visual descriptions

**Requirements**:
- Camera access permission in browser settings
- Compatible webcam hardware

## Security Considerations

When using system and code execution tools:

### Permission Management

- Configure appropriate permissions for system command execution
- Limit which commands can be executed
- Use the principle of least privilege

### Isolation

- Code interpreter runs in an isolated container
- No internet access from code execution environment
- Read-only access to mounted files

### Content Validation

- Validate and review code before execution
- Be cautious with commands that modify system state
- Consider potential security implications of user inputs

## Best Practices

### Command Execution

- Use specific, targeted commands rather than broad scripts
- Provide clear working directory contexts
- Handle command output appropriately
- Consider timeout settings for long-running commands

### Code Interpreter

- Structure code for clarity and error handling
- Use appropriate environment based on requirements
- Keep code modular for easier debugging
- Document code purpose and functionality

### Image Capture

- Ensure appropriate permissions are granted
- Be mindful of privacy when capturing screen or camera images
- Use the lowest necessary quality settings

## Use Cases

### Data Analysis Workflow

1. Use file system tools to access data files
2. Execute code with codeInterpreter to analyze and visualize data
3. Generate reports and export results

### Development Assistance

1. Capture screen showing error messages with screenCapture
2. Have the agent analyze the error
3. Execute commands to fix issues
4. Verify results with additional commands

### System Automation

1. Create scripts using writeToFile
2. Execute scripts using executeCommand
3. Capture and analyze results
4. Iterate and improve automation

## Troubleshooting

Common issues and solutions:

- **Permission Denied**: Check system permissions and allowed commands list
- **Command Not Found**: Verify command is installed and in PATH
- **Execution Timeout**: Adjust timeout settings for long-running operations
- **Memory Limitations**: Be mindful of resource usage in code execution

## Extending Capabilities

System execution capabilities can be extended by:

- Registering additional allowed commands
- Creating wrapper scripts for complex operations
- Configuring API access through command line tools
- Setting up specialized environments for specific use cases