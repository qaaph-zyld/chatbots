# Workspace Mapper - Comprehensive Codebase Analysis Tool

A powerful Python tool for mapping and analyzing workspace structure, dependencies, and relationships to provide AI agents with deep contextual understanding of codebases.

## 🚀 Features

### Core Analysis
- **Complete File System Mapping**: Analyzes entire workspace structure with intelligent filtering
- **Multi-Language Support**: JavaScript, TypeScript, Python, JSON, Markdown, YAML, and more
- **Dependency Analysis**: Tracks imports, exports, and relationships between files
- **Circular Dependency Detection**: Identifies and reports circular dependencies
- **Code Structure Extraction**: Functions, classes, variables, and API endpoints

### Search Capabilities
- **Simple Text Search**: Fast text-based search without external dependencies
- **Semantic Search**: AI-powered semantic search using vector embeddings (optional)
- **Function Finder**: Locate function definitions across the codebase
- **Import Tracker**: Find all files that import specific modules

### Reporting & Visualization
- **Comprehensive Reports**: Detailed analysis reports in Markdown and JSON
- **Statistics Dashboard**: File type distribution, largest files, complexity metrics
- **Dependency Graphs**: Visual representation of code relationships
- **API Endpoint Mapping**: Automatic detection of REST API endpoints

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- Virtual environment (recommended)

### Basic Installation
```bash
# Clone or download the workspace mapper files
cd your-project-directory

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Optional: AI-Powered Search
For semantic search capabilities, you'll need an OpenAI API key:

```bash
# Copy environment template
cp env_template.txt .env

# Edit .env and add your OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here
```

## 🛠️ Usage

### Command Line Interface

#### 1. Create Workspace Mapping
```bash
# Basic mapping
python cli_tool.py map /path/to/your/project

# With options
python cli_tool.py map /path/to/your/project --output my_mapping.json --report --include-hidden

# Using configuration file
python cli_tool.py map /path/to/your/project --config config_example.json
```

#### 2. Simple Text Search
```bash
# Search for text across all files
python simple_search.py "authentication" /path/to/project workspace_mapping.json

# Search in specific file types
python cli_tool.py search "login function" --file-type javascript

# Find function definitions
python simple_search.py "getUserById" /path/to/project workspace_mapping.json
```

#### 3. Semantic Search (Requires OpenAI API)
```bash
# Create semantic index
python cli_tool.py index /path/to/your/project

# Perform semantic search
python cli_tool.py search "how does authentication work"

# Ask questions about the codebase
python cli_tool.py ask "What are the main API endpoints?"

# Find similar files
python cli_tool.py similar src/auth/login.js
```

#### 4. Complete Analysis
```bash
# Perform full analysis (mapping + indexing)
python cli_tool.py analyze /path/to/your/project

# Check status
python cli_tool.py status
```

### Python API Usage

#### Basic Workspace Mapping
```python
from workspace_mapper import WorkspaceMapper

# Create mapper
mapper = WorkspaceMapper('/path/to/your/project')

# Build mapping
mapping = mapper.build_mapping()

# Save results
mapper.save_mapping('workspace_mapping.json')

# Generate report
report = mapper.generate_summary_report()
print(report)
```

#### Simple Search
```python
from simple_search import SimpleWorkspaceSearch

# Initialize search
search = SimpleWorkspaceSearch('/path/to/project', 'workspace_mapping.json')

# Search for text
results = search.search_files('authentication')

# Find functions
functions = search.find_functions('getUserById')

# Find imports
imports = search.find_imports('express')

# Get project statistics
stats = search.get_project_statistics()
```

#### Semantic Search (Optional)
```python
from semantic_search import SemanticSearchEngine, WorkspaceQuery

# Create search engine
engine = SemanticSearchEngine('/path/to/project')

# Create index
engine.create_index('vector_index')

# Perform search
results = engine.search('authentication system')

# Query interface
query_interface = WorkspaceQuery('/path/to/project', 'mapping.json', 'vector_index')
answer = query_interface.query('How does the API authentication work?')
```

## 📊 Output Examples

### Workspace Mapping Report
```markdown
# Workspace Analysis Summary

**Generated:** 2025-09-20T00:32:33
**Root Path:** /path/to/your/project
**Processing Time:** 5.86 seconds

## Statistics
- **Total Files:** 2466
- **Total Directories:** 706
- **File Types:** 19

### File Type Distribution
- **javascript_test:** 1178 files (47.8%)
- **javascript:** 489 files (19.8%)
- **markdown:** 296 files (12.0%)
- **typescript_react:** 112 files (4.5%)

### Analysis Results
- **Test Files:** 1178
- **API Endpoints:** 656
- **Circular Dependencies:** 10
```

### Search Results
```bash
🔍 Search results for 'authentication':
Found 5 matches

📄 Result 1: src/auth/middleware.js
   Line 15: const authenticateUser = async (req, res, next) => {
   Score: 1.00

📄 Result 2: src/controllers/auth.controller.js
   Line 23: async function handleAuthentication(credentials) {
   Score: 0.95
```

### JSON Output Structure
```json
{
  "metadata": {
    "version": "1.0.0",
    "generated": "2025-09-20T00:32:33.541649",
    "root_path": "/path/to/project"
  },
  "statistics": {
    "total_files": 2466,
    "total_directories": 706,
    "file_types": {...},
    "processing_time": 5.86
  },
  "structure": {
    "directories": {...},
    "files": [...],
    "modules": {...}
  },
  "dependencies": {
    "imports": {...},
    "exports": {...},
    "relationships": [...],
    "circular_deps": [...]
  },
  "analysis": {
    "entry_points": [...],
    "test_files": [...],
    "api_endpoints": [...],
    "database_models": [...]
  }
}
```

## ⚙️ Configuration

### Configuration File (config_example.json)
```json
{
  "ignore_dirs": [".git", "node_modules", "__pycache__", "dist", "build"],
  "ignore_extensions": [".pyc", ".log", ".tmp"],
  "max_file_size": 10485760,
  "include_hidden": false,
  "deep_analysis": true,
  "semantic_search": {
    "chunk_size": 1000,
    "chunk_overlap": 200,
    "include_extensions": [".js", ".jsx", ".ts", ".tsx", ".py", ".md"]
  }
}
```

### Environment Variables
```bash
# Required for semantic search
OPENAI_API_KEY=your_openai_api_key_here

# Optional
EMBEDDING_MODEL=text-embedding-ada-002
LOG_LEVEL=INFO
```

## 🎯 Use Cases

### For AI Agents
- **Context Injection**: Provide comprehensive codebase understanding
- **Code Navigation**: Help AI understand project structure and relationships
- **Intelligent Suggestions**: Enable context-aware code recommendations

### For Developers
- **Code Discovery**: Find functions, classes, and modules quickly
- **Dependency Analysis**: Understand code relationships and dependencies
- **Refactoring Support**: Identify circular dependencies and coupling issues
- **Documentation**: Auto-generate project documentation

### For Teams
- **Onboarding**: Help new team members understand codebase structure
- **Code Reviews**: Identify potential issues and improvements
- **Architecture Analysis**: Understand system design and patterns

## 🔧 Advanced Features

### Custom File Analysis
```python
# Extend WorkspaceMapper for custom analysis
class CustomMapper(WorkspaceMapper):
    def _analyze_custom_file(self, file_path, content, file_info):
        # Add custom analysis logic
        pass
```

### Integration with CI/CD
```yaml
# GitHub Actions example
- name: Analyze Workspace
  run: |
    python cli_tool.py analyze .
    python cli_tool.py search "TODO" > todos.txt
```

### IDE Integration
The workspace mapper can be integrated with IDEs through:
- Language Server Protocol (LSP)
- VS Code extensions
- Custom plugins

## 📈 Performance

### Benchmarks
- **Small Project** (< 100 files): ~1 second
- **Medium Project** (< 1000 files): ~5 seconds  
- **Large Project** (< 10000 files): ~30 seconds

### Optimization Tips
- Use `.gitignore` patterns to exclude unnecessary files
- Set appropriate `max_file_size` limits
- Enable `deep_analysis` only when needed
- Use incremental updates for large projects

## 🤝 Contributing

### Development Setup
```bash
# Clone repository
git clone <repository-url>
cd workspace-mapper

# Install development dependencies
pip install -r requirements.txt
pip install -e .

# Run tests
python -m pytest tests/
```

### Adding New File Types
1. Extend `_get_file_type()` method in `WorkspaceMapper`
2. Add analysis logic in `_analyze_<filetype>()` method
3. Update configuration examples
4. Add tests

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

#### "langchain not available" Warning
- **Solution**: Install optional dependencies: `pip install langchain openai faiss-cpu`
- **Alternative**: Use simple search functionality without AI features

#### Large File Warnings
- **Solution**: Adjust `max_file_size` in configuration or add files to ignore list

#### Encoding Errors
- **Solution**: The tool automatically tries multiple encodings, but some files may need manual handling

#### Memory Issues with Large Projects
- **Solution**: 
  - Increase system memory
  - Use more restrictive ignore patterns
  - Process subdirectories separately

### Getting Help
1. Check the configuration file for proper settings
2. Review the generated reports for insights
3. Use verbose logging: `python cli_tool.py --verbose`
4. Check file permissions and access rights

## 🔮 Future Enhancements

- **Real-time Updates**: File system watching for automatic updates
- **Git Integration**: Track code evolution over time
- **Visual Dependency Graphs**: Interactive visualization
- **Code Quality Metrics**: Complexity analysis and technical debt tracking
- **Multi-Repository Support**: Analyze multiple related projects
- **Plugin System**: Extensible architecture for custom analyzers

---

**Generated by Workspace Mapper v1.0.0** - Comprehensive codebase analysis for AI-enhanced development
