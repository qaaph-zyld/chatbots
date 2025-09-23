# Workspace Mapper Integration Guide

## 🎯 Quick Integration for AI Agents

### Immediate Benefits for Your Chatbot Project

Your workspace mapper has already analyzed your entire chatbot project and can now provide AI agents with:

```json
{
  "project_overview": {
    "total_files": 2471,
    "test_coverage": "47.7% (excellent)",
    "api_endpoints": 656,
    "documentation_files": 336,
    "main_technologies": ["JavaScript", "TypeScript", "React", "Node.js", "Jest"]
  },
  "key_insights": {
    "strengths": [
      "Excellent test coverage with 1,178 test files",
      "Well-documented with 336 documentation files", 
      "Large API surface with 656 endpoints detected",
      "Multi-technology stack properly organized"
    ],
    "areas_for_improvement": [
      "10 circular dependencies need resolution",
      "Some large files could be optimized",
      "19 different file types suggest potential consolidation"
    ]
  }
}
```

### Integration with AI Development Workflow

#### 1. Context Injection for AI Agents
```python
# Example: Provide context to AI agent
from workspace_mapper import WorkspaceMapper
from simple_search import SimpleWorkspaceSearch

def get_ai_context(query):
    search = SimpleWorkspaceSearch(".", "workspace_mapping.json")
    
    # Get relevant code sections
    results = search.search_files(query, max_results=5)
    
    # Get project statistics
    stats = search.get_project_statistics()
    
    context = {
        "query": query,
        "relevant_files": [r.file_path for r in results],
        "project_stats": stats,
        "code_samples": [r.content for r in results[:3]]
    }
    
    return context

# Usage
context = get_ai_context("authentication system")
# Feed this context to your AI agent for better responses
```

#### 2. Automated Code Discovery
```python
# Find all authentication-related code
auth_files = search.search_files("auth", max_results=20)
login_functions = search.find_functions("login")
auth_imports = search.find_imports("passport")

# Create comprehensive authentication map
auth_context = {
    "files": [f.file_path for f in auth_files],
    "functions": [f.file_path for f in login_functions], 
    "dependencies": [f.file_path for f in auth_imports]
}
```

#### 3. Real-time Project Understanding
```bash
# Before working on a feature, get instant context
python simple_search.py "payment processing" . workspace_mapping.json
python simple_search.py "user management" . workspace_mapping.json
python simple_search.py "API routes" . workspace_mapping.json
```

## 🔧 Development Workflow Integration

### Daily Development Tasks

#### Code Navigation
```bash
# Find where a function is defined
python simple_search.py "getUserById" . workspace_mapping.json

# Find all files using a specific module
python cli_tool.py search "express" --file-type javascript

# Understand project structure
python cli_tool.py status
```

#### Before Code Changes
```bash
# Analyze current state
python cli_tool.py map . --report

# Find related code
python simple_search.py "authentication middleware" . workspace_mapping.json

# Check for circular dependencies
grep -A 5 "Circular Dependencies" workspace_mapping.md
```

#### After Code Changes
```bash
# Re-analyze to see impact
python cli_tool.py map . --output updated_mapping.json

# Compare changes (manual diff of JSON files)
# Future enhancement: automated change detection
```

### CI/CD Integration

#### GitHub Actions Example
```yaml
name: Workspace Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
        
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        
    - name: Analyze workspace
      run: |
        python cli_tool.py map . --output analysis.json --report
        
    - name: Check for issues
      run: |
        python -c "
        import json
        with open('analysis.json') as f:
            data = json.load(f)
        
        circular_deps = len(data['dependencies']['circular_deps'])
        if circular_deps > 0:
            print(f'WARNING: {circular_deps} circular dependencies found')
            exit(1)
        "
        
    - name: Upload analysis
      uses: actions/upload-artifact@v2
      with:
        name: workspace-analysis
        path: |
          analysis.json
          workspace_mapping.md
```

## 🤖 AI Agent Enhancement Patterns

### Pattern 1: Context-Aware Code Assistance
```python
def enhanced_code_assistant(user_question, workspace_path="."):
    """Provide context-aware code assistance."""
    
    # Get workspace context
    search = SimpleWorkspaceSearch(workspace_path, "workspace_mapping.json")
    
    # Find relevant code
    relevant_code = search.search_files(user_question, max_results=10)
    
    # Get project statistics for context
    stats = search.get_project_statistics()
    
    # Build enhanced context
    context = f"""
    Project Context:
    - Total files: {stats['total_files']}
    - Test coverage: {stats['test_files']} test files
    - API endpoints: {stats['api_endpoints']}
    
    Relevant Code Sections:
    """
    
    for result in relevant_code[:5]:
        context += f"\n{result.file_path}:{result.line_number}\n{result.content}\n"
    
    return context

# Usage with AI
user_question = "How do I add authentication to a new API endpoint?"
context = enhanced_code_assistant(user_question)
# Send context + question to AI model for better response
```

### Pattern 2: Intelligent Code Review
```python
def ai_code_review_context(changed_files):
    """Provide context for AI-powered code reviews."""
    
    search = SimpleWorkspaceSearch(".", "workspace_mapping.json")
    
    review_context = {}
    
    for file_path in changed_files:
        # Get file information
        file_info = search.get_file_info(file_path)
        
        if file_info:
            # Find related files
            related_imports = search.find_imports(file_path.split('/')[-1])
            related_functions = []
            
            # Get functions in this file
            for func in file_info.get('functions', []):
                func_results = search.find_functions(func)
                related_functions.extend(func_results)
            
            review_context[file_path] = {
                'file_type': file_info.get('type'),
                'functions': file_info.get('functions', []),
                'imports': file_info.get('imports', []),
                'related_files': [r.file_path for r in related_imports],
                'function_usage': [r.file_path for r in related_functions]
            }
    
    return review_context
```

### Pattern 3: Architecture Understanding
```python
def get_architecture_overview():
    """Generate architecture overview for AI understanding."""
    
    with open('workspace_mapping.json', 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    architecture = {
        'entry_points': mapping['analysis']['entry_points'],
        'api_structure': {
            'endpoints': len(mapping['analysis']['api_endpoints']),
            'methods': {}
        },
        'test_strategy': {
            'total_tests': len(mapping['analysis']['test_files']),
            'coverage_ratio': len(mapping['analysis']['test_files']) / mapping['statistics']['total_files']
        },
        'dependencies': {
            'external': list(mapping['dependencies']['external_deps']),
            'circular_issues': mapping['dependencies']['circular_deps']
        },
        'file_organization': dict(mapping['statistics']['file_types'])
    }
    
    # Analyze API endpoints
    for endpoint in mapping['analysis']['api_endpoints']:
        method = endpoint.get('method', 'UNKNOWN')
        architecture['api_structure']['methods'][method] = \
            architecture['api_structure']['methods'].get(method, 0) + 1
    
    return architecture
```

## 📊 Monitoring and Maintenance

### Regular Health Checks
```bash
# Weekly project health check
python cli_tool.py analyze . --output weekly_analysis.json

# Check for new circular dependencies
python -c "
import json
with open('weekly_analysis.json') as f:
    data = json.load(f)
circular_count = len(data['dependencies']['circular_deps'])
print(f'Circular dependencies: {circular_count}')
if circular_count > 10:
    print('WARNING: Circular dependencies increasing!')
"

# Monitor project growth
python -c "
import json
with open('weekly_analysis.json') as f:
    data = json.load(f)
stats = data['statistics']
print(f'Project size: {stats[\"total_files\"]} files')
print(f'Test ratio: {len(data[\"analysis\"][\"test_files\"]) / stats[\"total_files\"]:.1%}')
"
```

### Performance Optimization
```bash
# Find largest files for optimization
python -c "
import json
with open('workspace_mapping.json', encoding='utf-8') as f:
    data = json.load(f)
largest = data['statistics']['largest_files']
print('Largest files (potential optimization targets):')
for file_info in largest[:5]:
    size_mb = file_info['size'] / (1024 * 1024)
    print(f'  {file_info[\"path\"]}: {size_mb:.2f} MB')
"
```

## 🎯 Best Practices

### 1. Regular Updates
- Run analysis after major changes
- Update mapping before AI-assisted development sessions
- Monitor circular dependencies growth

### 2. Configuration Tuning
- Adjust `max_file_size` based on your project
- Update ignore patterns for generated files
- Customize file type detection for domain-specific files

### 3. Search Optimization
- Use specific queries for better results
- Combine text search with file type filters
- Leverage function and import searches for code navigation

### 4. AI Integration
- Provide workspace context with every AI query
- Use architecture overview for high-level questions
- Combine multiple search results for comprehensive context

## 🚀 Advanced Use Cases

### Custom Analysis Scripts
```python
# Find all TODO items across the project
def find_todos():
    search = SimpleWorkspaceSearch(".", "workspace_mapping.json")
    todos = search.search_files("TODO", max_results=50)
    
    for todo in todos:
        print(f"{todo.file_path}:{todo.line_number} - {todo.content}")

# Analyze test coverage by directory
def analyze_test_coverage_by_dir():
    with open('workspace_mapping.json', 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    test_files = set(mapping['analysis']['test_files'])
    all_files = {f['path'] for f in mapping['structure']['files']}
    
    # Group by directory
    dir_stats = {}
    for file_path in all_files:
        dir_name = '/'.join(file_path.split('/')[:-1]) or 'root'
        if dir_name not in dir_stats:
            dir_stats[dir_name] = {'total': 0, 'tests': 0}
        
        dir_stats[dir_name]['total'] += 1
        if file_path in test_files:
            dir_stats[dir_name]['tests'] += 1
    
    # Calculate coverage ratios
    for dir_name, stats in dir_stats.items():
        ratio = stats['tests'] / stats['total'] if stats['total'] > 0 else 0
        print(f"{dir_name}: {ratio:.1%} test coverage ({stats['tests']}/{stats['total']})")
```

This integration guide provides everything needed to maximize the value of your workspace mapper for AI-enhanced development workflows. The system is ready for immediate use and will significantly improve AI agent understanding of your codebase.
