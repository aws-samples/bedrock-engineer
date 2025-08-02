# File System Operations

Agent Chat provides several tools for interacting with the file system, allowing agents to create, read, write, list, move, and copy files. This document details the available file system operations and their usage.

## Available File System Tools

### createFolder

Creates a new directory within the project structure.

**Usage**:
- Creates a new folder at the specified path
- If parent directories don't exist, they are created automatically
- Returns confirmation of folder creation

**Example**:
```
Creating a project structure for a React application:
/project
  /src
    /components
    /hooks
    /utils
    /pages
  /public
  /tests
```

### writeToFile

Writes content to a file.

**Usage**:
- Creates a new file if it doesn't exist
- Updates content if the file already exists
- Can append to or replace existing content
- Supports various file formats including text files and code files

**Example**:
```javascript
// Creating a new React component
const MyComponent = () => {
  return (
    <div className="container">
      <h1>Hello World</h1>
      <p>This is my first component</p>
    </div>
  );
};

export default MyComponent;
```

### readFiles

Reads contents from multiple files simultaneously.

**Usage**:
- Can read multiple files at once
- Supports text files and Excel files (.xlsx, .xls)
- Excel files are automatically converted to CSV format
- Returns the content of each file separately

**Supported File Types**:
- Text files (.txt, .md, .js, .py, etc.)
- Excel files (.xlsx, .xls) - converted to CSV
- JSON files (.json)
- CSV files (.csv)
- Configuration files (.yml, .yaml, .ini, etc.)

### listFiles

Displays directory structure in a hierarchical format.

**Usage**:
- Provides comprehensive project structure
- Includes all subdirectories and files
- Follows configured ignore patterns
- Can filter by file type or pattern

**Example Output**:
```
/project
├── package.json
├── README.md
├── src/
│   ├── components/
│   │   ├── Button.jsx
│   │   └── Header.jsx
│   ├── App.jsx
│   └── index.js
├── public/
│   ├── index.html
│   └── favicon.ico
└── tests/
    └── App.test.js
```

### moveFile

Moves a file to a different location.

**Usage**:
- Used for organizing files within the project structure
- Source file is removed after successful move
- Can rename files during move operation
- Creates target directory if it doesn't exist

### copyFile

Duplicates a file to a different location.

**Usage**:
- Creates a duplicate of a file in a different location
- Source file remains unchanged
- Can rename the copied file
- Creates target directory if it doesn't exist

## Configuration Options

File system operations can be configured with the following options:

### Ignore Patterns

Specify patterns for files and directories that should be ignored during file listing:

- Default patterns include: `node_modules`, `.git`, `build`, `dist`
- Custom patterns can be added in the configuration
- Supports glob patterns like `*.log` or `**/*.tmp`

### File Size Limits

- Maximum file size for read operations: 10MB by default
- Can be configured for specific file types

### Path Restrictions

For security reasons, file operations may be restricted to:

- The current project directory
- Specific whitelisted directories
- Non-system directories

## Best Practices

When using file system operations in your agents:

1. **Structure**: Maintain a clean directory structure for projects
2. **Permissions**: Ensure proper file permissions for created files
3. **Error Handling**: Consider potential file operation failures in your workflows
4. **Large Files**: Be cautious when reading or writing large files

## Related Tools

- [System Command & Code Execution](./system-execution.md): For more advanced file system interactions
- [Web & Search Operations](./web-search.md): For downloading content from the web to local files