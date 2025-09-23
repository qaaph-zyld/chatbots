#!/usr/bin/env python3
"""
Workspace Mapper - Comprehensive Codebase Analysis Tool
======================================================

A powerful tool for mapping and analyzing workspace structure, dependencies,
and relationships to provide AI agents with deep contextual understanding.

Author: Workspace Analysis Framework
Version: 1.0.0
Python: 3.8+
"""

import os
import json
import re
import ast
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Set, Tuple
from datetime import datetime
from collections import defaultdict, Counter
import logging

# Optional imports for enhanced functionality
try:
    import esprima
    HAS_ESPRIMA = True
except ImportError:
    HAS_ESPRIMA = False
    print("Warning: esprima not available. JavaScript parsing will be limited.")

try:
    from bs4 import BeautifulSoup
    import markdown
    HAS_MARKDOWN = True
except ImportError:
    HAS_MARKDOWN = False
    print("Warning: markdown/beautifulsoup4 not available. Documentation parsing will be limited.")


class WorkspaceMapper:
    """
    Core workspace mapping class that analyzes file structure, dependencies,
    and relationships across the entire codebase.
    """
    
    VERSION = "1.0.0"
    
    def __init__(self, root_dir: str, config: Optional[Dict] = None):
        """Initialize the workspace mapper with configuration."""
        self.root_dir = Path(root_dir).resolve()
        self.start_time = time.time()
        
        # Default configuration
        self.config = {
            'ignore_dirs': {
                '.git', 'node_modules', '__pycache__', 'dist', 'build', 
                'coverage', '.pytest_cache', '.vscode', '.idea', 'venv',
                'env', '.env', 'logs', 'tmp', 'temp'
            },
            'ignore_extensions': {
                '.pyc', '.pyo', '.pyd', '.so', '.dll', '.exe', '.bin',
                '.log', '.tmp', '.cache', '.lock', '.pid'
            },
            'ignore_files': {
                '.DS_Store', 'Thumbs.db', '.gitignore', '.gitkeep',
                'package-lock.json', 'yarn.lock', 'poetry.lock'
            },
            'max_file_size': 10 * 1024 * 1024,  # 10MB
            'include_hidden': False,
            'deep_analysis': True
        }
        
        # Update with user config
        if config:
            self.config.update(config)
        
        # Initialize data structures
        self.mapping = {
            'metadata': {
                'version': self.VERSION,
                'generated': datetime.now().isoformat(),
                'root_path': str(self.root_dir),
                'config': self.config
            },
            'statistics': {
                'total_files': 0,
                'total_directories': 0,
                'file_types': Counter(),
                'largest_files': [],
                'processing_time': 0
            },
            'structure': {
                'directories': {},
                'files': [],
                'modules': {}
            },
            'dependencies': {
                'imports': defaultdict(list),
                'exports': defaultdict(list),
                'relationships': [],
                'circular_deps': [],
                'external_deps': set()
            },
            'analysis': {
                'entry_points': [],
                'test_files': [],
                'config_files': [],
                'documentation': [],
                'api_endpoints': [],
                'database_models': []
            }
        }
        
        # Setup logging
        self._setup_logging()
        
    def _setup_logging(self) -> None:
        """Configure logging for the mapper."""
        logging.basicConfig(
            level=logging.INFO,
            format='[%(asctime)s] [%(levelname)s] %(message)s',
            datefmt='%H:%M:%S'
        )
        self.logger = logging.getLogger(__name__)
        
    def should_ignore(self, path: Path) -> bool:
        """Check if a path should be ignored based on configuration."""
        # Check if it's a hidden file/directory and we're not including them
        if not self.config['include_hidden'] and path.name.startswith('.'):
            # Allow specific directories like .github, .vscode
            if path.name not in {'.github', '.vscode'}:
                return True
        
        # Check ignore patterns
        if path.name in self.config['ignore_files']:
            return True
            
        if path.suffix in self.config['ignore_extensions']:
            return True
            
        # Check if any part of the path contains ignored directories
        if any(ignore_dir in path.parts for ignore_dir in self.config['ignore_dirs']):
            return True
            
        # Check file size if it's a file
        if path.is_file():
            try:
                if path.stat().st_size > self.config['max_file_size']:
                    self.logger.warning(f"Skipping large file: {path} ({path.stat().st_size} bytes)")
                    return True
            except (OSError, IOError):
                return True
                
        return False
        
    def analyze_file(self, file_path: Path) -> Dict[str, Any]:
        """Analyze a single file and extract comprehensive information."""
        relative_path = str(file_path.relative_to(self.root_dir))
        
        # Basic file information
        try:
            stat = file_path.stat()
            file_info = {
                'path': relative_path,
                'absolute_path': str(file_path),
                'name': file_path.name,
                'stem': file_path.stem,
                'suffix': file_path.suffix,
                'type': self._get_file_type(file_path),
                'size': stat.st_size,
                'modified': stat.st_mtime,
                'created': stat.st_ctime,
                'is_binary': self._is_binary_file(file_path),
                'encoding': None,
                'lines': 0,
                'imports': [],
                'exports': [],
                'functions': [],
                'classes': [],
                'variables': [],
                'comments': [],
                'todos': [],
                'complexity': 0,
                'dependencies': []
            }
        except (OSError, IOError) as e:
            self.logger.error(f"Error accessing file {file_path}: {e}")
            return {}
            
        # Skip binary files for content analysis
        if file_info['is_binary']:
            return file_info
            
        # Analyze file content
        try:
            content = self._read_file_safely(file_path)
            if content is not None:
                file_info['encoding'] = 'utf-8'  # Simplified for now
                file_info['lines'] = len(content.splitlines())
                
                # Perform type-specific analysis
                if file_path.suffix.lower() in {'.js', '.jsx', '.ts', '.tsx'}:
                    self._analyze_javascript(file_path, content, file_info)
                elif file_path.suffix.lower() in {'.py'}:
                    self._analyze_python(file_path, content, file_info)
                elif file_path.suffix.lower() in {'.json'}:
                    self._analyze_json(file_path, content, file_info)
                elif file_path.suffix.lower() in {'.md', '.markdown'}:
                    self._analyze_markdown(file_path, content, file_info)
                elif file_path.suffix.lower() in {'.yml', '.yaml'}:
                    self._analyze_yaml(file_path, content, file_info)
                    
                # Common analysis for all text files
                self._analyze_common_patterns(content, file_info)
                
        except Exception as e:
            self.logger.error(f"Error analyzing file content {file_path}: {e}")
            
        return file_info
        
    def _get_file_type(self, file_path: Path) -> str:
        """Determine the file type based on extension and content."""
        suffix = file_path.suffix.lower()
        
        type_mapping = {
            '.js': 'javascript',
            '.jsx': 'javascript_react',
            '.ts': 'typescript',
            '.tsx': 'typescript_react',
            '.py': 'python',
            '.json': 'json',
            '.md': 'markdown',
            '.markdown': 'markdown',
            '.yml': 'yaml',
            '.yaml': 'yaml',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.xml': 'xml',
            '.txt': 'text',
            '.log': 'log',
            '.env': 'environment',
            '.gitignore': 'gitignore',
            '.dockerfile': 'dockerfile',
            '.sql': 'sql'
        }
        
        # Special cases based on filename
        name = file_path.name.lower()
        if name in {'dockerfile', 'makefile', 'rakefile'}:
            return name
        elif name.startswith('readme'):
            return 'readme'
        elif name.endswith('.test.js') or name.endswith('.spec.js'):
            return 'javascript_test'
        elif name.endswith('.config.js') or name.endswith('.config.json'):
            return 'configuration'
            
        return type_mapping.get(suffix, 'unknown')
        
    def _is_binary_file(self, file_path: Path) -> bool:
        """Check if a file is binary."""
        binary_extensions = {
            '.exe', '.dll', '.so', '.dylib', '.bin', '.obj', '.o',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
            '.mp3', '.mp4', '.avi', '.mov', '.wav', '.pdf', '.zip',
            '.tar', '.gz', '.rar', '.7z', '.woff', '.woff2', '.ttf',
            '.eot', '.otf'
        }
        
        if file_path.suffix.lower() in binary_extensions:
            return True
            
        # Check first few bytes for binary content
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(1024)
                if b'\x00' in chunk:
                    return True
        except (OSError, IOError):
            return True
            
        return False
        
    def _read_file_safely(self, file_path: Path) -> Optional[str]:
        """Safely read file content with encoding detection."""
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252', 'iso-8859-1']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except (UnicodeDecodeError, UnicodeError):
                continue
            except (OSError, IOError) as e:
                self.logger.error(f"Error reading file {file_path}: {e}")
                return None
                
        self.logger.warning(f"Could not decode file {file_path} with any encoding")
        return None
        
    def _analyze_javascript(self, file_path: Path, content: str, file_info: Dict) -> None:
        """Analyze JavaScript/TypeScript files."""
        # Extract imports using regex (fallback if esprima not available)
        import_patterns = [
            r'import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?[\'"]([^\'"]+)[\'"]',
            r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)',
            r'import\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content)
            file_info['imports'].extend(matches)
            
        # Extract exports
        export_patterns = [
            r'export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)',
            r'export\s+\{\s*([^}]+)\s*\}',
            r'module\.exports\s*=\s*(\w+)',
            r'exports\.(\w+)\s*='
        ]
        
        for pattern in export_patterns:
            matches = re.findall(pattern, content)
            file_info['exports'].extend(matches)
            
        # Extract functions
        function_patterns = [
            r'function\s+(\w+)\s*\(',
            r'const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>',
            r'(\w+)\s*:\s*(?:async\s+)?function\s*\(',
            r'async\s+function\s+(\w+)\s*\('
        ]
        
        for pattern in function_patterns:
            matches = re.findall(pattern, content)
            file_info['functions'].extend(matches)
            
        # Extract classes
        class_matches = re.findall(r'class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{', content)
        file_info['classes'] = [match[0] for match in class_matches]
        
        # Check if it's a test file
        if any(test_indicator in content.lower() for test_indicator in ['describe(', 'it(', 'test(', 'expect(']):
            file_info['type'] = 'javascript_test'
            self.mapping['analysis']['test_files'].append(file_info['path'])
            
        # Check for API endpoints
        api_patterns = [
            r'app\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]',
            r'router\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]',
            r'@(Get|Post|Put|Delete|Patch)\s*\(\s*[\'"]([^\'"]+)[\'"]'
        ]
        
        for pattern in api_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                self.mapping['analysis']['api_endpoints'].append({
                    'method': match[0].upper(),
                    'path': match[1],
                    'file': file_info['path']
                })
                
    def _analyze_python(self, file_path: Path, content: str, file_info: Dict) -> None:
        """Analyze Python files using AST."""
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        file_info['imports'].append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        file_info['imports'].append(node.module)
                elif isinstance(node, ast.FunctionDef):
                    file_info['functions'].append(node.name)
                elif isinstance(node, ast.ClassDef):
                    file_info['classes'].append(node.name)
                elif isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            file_info['variables'].append(target.id)
                            
        except SyntaxError as e:
            self.logger.warning(f"Syntax error in Python file {file_path}: {e}")
        except Exception as e:
            self.logger.error(f"Error parsing Python file {file_path}: {e}")
            
    def _analyze_json(self, file_path: Path, content: str, file_info: Dict) -> None:
        """Analyze JSON files."""
        try:
            data = json.loads(content)
            
            # Special handling for package.json
            if file_path.name == 'package.json':
                file_info['type'] = 'package_json'
                if 'dependencies' in data:
                    file_info['dependencies'] = list(data['dependencies'].keys())
                    self.mapping['dependencies']['external_deps'].update(data['dependencies'].keys())
                if 'devDependencies' in data:
                    file_info['dev_dependencies'] = list(data['devDependencies'].keys())
                    
            # Check for configuration files
            if any(key in file_path.name.lower() for key in ['config', 'settings', 'env']):
                file_info['type'] = 'configuration'
                self.mapping['analysis']['config_files'].append(file_info['path'])
                
        except json.JSONDecodeError as e:
            self.logger.warning(f"Invalid JSON in file {file_path}: {e}")
            
    def _analyze_markdown(self, file_path: Path, content: str, file_info: Dict) -> None:
        """Analyze Markdown files."""
        # Extract headers
        headers = re.findall(r'^(#{1,6})\s+(.+)$', content, re.MULTILINE)
        file_info['headers'] = [(len(h[0]), h[1]) for h in headers]
        
        # Extract links
        links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
        file_info['links'] = links
        
        # Mark as documentation
        self.mapping['analysis']['documentation'].append(file_info['path'])
        
    def _analyze_yaml(self, file_path: Path, content: str, file_info: Dict) -> None:
        """Analyze YAML files."""
        # Check for common configuration patterns
        if any(indicator in content.lower() for indicator in ['version:', 'name:', 'scripts:']):
            file_info['type'] = 'configuration'
            self.mapping['analysis']['config_files'].append(file_info['path'])
            
    def _analyze_common_patterns(self, content: str, file_info: Dict) -> None:
        """Analyze common patterns across all text files."""
        # Extract TODO comments
        todo_patterns = [
            r'(?://|#|\*)\s*(TODO|FIXME|HACK|NOTE|BUG)(?:\([^)]+\))?\s*:?\s*(.+)',
            r'(?://|#|\*)\s*(XXX)\s*:?\s*(.+)'
        ]
        
        for pattern in todo_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                file_info['todos'].append({
                    'type': match[0].upper(),
                    'text': match[1].strip()
                })
                
        # Count comments (approximate)
        comment_patterns = [
            r'//.*$',  # Single line comments
            r'/\*.*?\*/',  # Multi-line comments
            r'#.*$',  # Python/shell comments
            r'<!--.*?-->'  # HTML comments
        ]
        
        comment_count = 0
        for pattern in comment_patterns:
            comment_count += len(re.findall(pattern, content, re.MULTILINE | re.DOTALL))
        file_info['comment_count'] = comment_count
        
    def build_directory_structure(self) -> Dict[str, Any]:
        """Build a hierarchical directory structure."""
        structure = {}
        
        for root, dirs, files in os.walk(self.root_dir):
            root_path = Path(root)
            
            # Skip ignored directories
            dirs[:] = [d for d in dirs if not self.should_ignore(root_path / d)]
            
            # Create relative path
            try:
                rel_path = root_path.relative_to(self.root_dir)
                path_parts = rel_path.parts if rel_path != Path('.') else []
            except ValueError:
                continue
                
            # Navigate to the correct position in structure
            current = structure
            for part in path_parts:
                if part not in current:
                    current[part] = {'_files': [], '_dirs': {}}
                current = current[part]['_dirs']
                
            # Add files to current directory
            for file in files:
                file_path = root_path / file
                if not self.should_ignore(file_path):
                    if path_parts:
                        # Navigate back to the directory level
                        dir_level = structure
                        for part in path_parts[:-1]:
                            dir_level = dir_level[part]['_dirs']
                        dir_level[path_parts[-1]]['_files'].append(file)
                    else:
                        # Root level
                        if '_files' not in structure:
                            structure['_files'] = []
                        structure['_files'].append(file)
                        
        return structure
        
    def analyze_dependencies(self) -> None:
        """Analyze dependencies and relationships between files."""
        self.logger.info("Analyzing dependencies and relationships...")
        
        # Build import/export relationships
        for file_info in self.mapping['structure']['files']:
            file_path = file_info['path']
            
            for imported in file_info.get('imports', []):
                # Try to resolve relative imports
                resolved = self._resolve_import(file_path, imported)
                if resolved:
                    self.mapping['dependencies']['relationships'].append({
                        'from': file_path,
                        'to': resolved,
                        'type': 'imports'
                    })
                    
        # Detect circular dependencies
        self._detect_circular_dependencies()
        
    def _resolve_import(self, from_file: str, import_path: str) -> Optional[str]:
        """Resolve an import path to an actual file."""
        from_dir = Path(from_file).parent
        
        # Handle relative imports
        if import_path.startswith('./') or import_path.startswith('../'):
            try:
                resolved_path = (self.root_dir / from_dir / import_path).resolve()
                
                # Try different extensions
                for ext in ['.js', '.ts', '.jsx', '.tsx', '.json']:
                    candidate = resolved_path.with_suffix(ext)
                    if candidate.exists():
                        return str(candidate.relative_to(self.root_dir))
                        
                # Try index files
                for ext in ['.js', '.ts', '.jsx', '.tsx']:
                    candidate = resolved_path / f'index{ext}'
                    if candidate.exists():
                        return str(candidate.relative_to(self.root_dir))
                        
            except (ValueError, OSError):
                pass
                
        # Handle absolute imports (simplified)
        # This would need more sophisticated logic for real module resolution
        
        return None
        
    def _detect_circular_dependencies(self) -> None:
        """Detect circular dependencies in the import graph."""
        # Build adjacency list
        graph = defaultdict(list)
        for rel in self.mapping['dependencies']['relationships']:
            if rel['type'] == 'imports':
                graph[rel['from']].append(rel['to'])
                
        # DFS to detect cycles
        visited = set()
        rec_stack = set()
        
        def has_cycle(node: str, path: List[str]) -> bool:
            if node in rec_stack:
                # Found a cycle - find where it starts
                try:
                    cycle_start = path.index(node)
                    cycle = path[cycle_start:] + [node]
                    self.mapping['dependencies']['circular_deps'].append(cycle)
                except ValueError:
                    # Node not in current path, add simple cycle
                    self.mapping['dependencies']['circular_deps'].append([node])
                return True
                
            if node in visited:
                return False
                
            visited.add(node)
            rec_stack.add(node)
            path.append(node)
            
            for neighbor in graph.get(node, []):
                if has_cycle(neighbor, path.copy()):  # Use copy to avoid path issues
                    return True
                    
            path.pop()
            rec_stack.remove(node)
            return False
            
        # Create a list of nodes to avoid dictionary size change during iteration
        nodes_to_check = list(graph.keys())
        for node in nodes_to_check:
            if node not in visited:
                has_cycle(node, [])
                
    def build_mapping(self) -> Dict[str, Any]:
        """Build the complete workspace mapping."""
        self.logger.info(f"Starting workspace analysis of: {self.root_dir}")
        
        # Build directory structure
        self.mapping['structure']['directories'] = self.build_directory_structure()
        
        # Analyze all files
        file_count = 0
        dir_count = 0
        
        for root, dirs, files in os.walk(self.root_dir):
            root_path = Path(root)
            
            # Skip ignored directories
            dirs[:] = [d for d in dirs if not self.should_ignore(root_path / d)]
            dir_count += len(dirs)
            
            for file in files:
                file_path = root_path / file
                if not self.should_ignore(file_path):
                    file_info = self.analyze_file(file_path)
                    if file_info:
                        self.mapping['structure']['files'].append(file_info)
                        file_count += 1
                        
                        # Update statistics
                        self.mapping['statistics']['file_types'][file_info['type']] += 1
                        
                        # Track largest files
                        if len(self.mapping['statistics']['largest_files']) < 10:
                            self.mapping['statistics']['largest_files'].append({
                                'path': file_info['path'],
                                'size': file_info['size']
                            })
                        else:
                            # Keep only top 10 largest files
                            largest = self.mapping['statistics']['largest_files']
                            min_size = min(f['size'] for f in largest)
                            if file_info['size'] > min_size:
                                # Remove smallest and add current
                                largest = [f for f in largest if f['size'] != min_size]
                                largest.append({
                                    'path': file_info['path'],
                                    'size': file_info['size']
                                })
                                self.mapping['statistics']['largest_files'] = largest
                                
        # Update statistics
        self.mapping['statistics']['total_files'] = file_count
        self.mapping['statistics']['total_directories'] = dir_count
        
        # Sort largest files
        self.mapping['statistics']['largest_files'].sort(
            key=lambda x: x['size'], reverse=True
        )
        
        # Analyze dependencies
        self.analyze_dependencies()
        
        # Calculate processing time
        self.mapping['statistics']['processing_time'] = time.time() - self.start_time
        
        self.logger.info(f"Analysis complete: {file_count} files, {dir_count} directories")
        self.logger.info(f"Processing time: {self.mapping['statistics']['processing_time']:.2f} seconds")
        
        return self.mapping
        
    def save_mapping(self, output_path: str) -> None:
        """Save the mapping to a JSON file."""
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert sets to lists for JSON serialization
        mapping_copy = json.loads(json.dumps(self.mapping, default=str))
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(mapping_copy, f, indent=2, ensure_ascii=False)
            self.logger.info(f"Workspace mapping saved to: {output_path}")
        except Exception as e:
            self.logger.error(f"Failed to save mapping: {e}")
            raise
            
    def generate_summary_report(self) -> str:
        """Generate a human-readable summary report."""
        stats = self.mapping['statistics']
        analysis = self.mapping['analysis']
        
        report = f"""
# Workspace Analysis Summary

**Generated:** {self.mapping['metadata']['generated']}
**Root Path:** {self.mapping['metadata']['root_path']}
**Processing Time:** {stats['processing_time']:.2f} seconds

## Statistics
- **Total Files:** {stats['total_files']}
- **Total Directories:** {stats['total_directories']}
- **File Types:** {len(stats['file_types'])}

### File Type Distribution
"""
        
        for file_type, count in stats['file_types'].most_common():
            percentage = (count / stats['total_files']) * 100
            report += f"- **{file_type}:** {count} files ({percentage:.1f}%)\n"
            
        report += f"""
### Largest Files
"""
        for file_info in stats['largest_files'][:5]:
            size_mb = file_info['size'] / (1024 * 1024)
            report += f"- **{file_info['path']}:** {size_mb:.2f} MB\n"
            
        report += f"""
## Analysis Results
- **Test Files:** {len(analysis['test_files'])}
- **Configuration Files:** {len(analysis['config_files'])}
- **Documentation Files:** {len(analysis['documentation'])}
- **API Endpoints:** {len(analysis['api_endpoints'])}
- **External Dependencies:** {len(self.mapping['dependencies']['external_deps'])}
- **Circular Dependencies:** {len(self.mapping['dependencies']['circular_deps'])}

### Circular Dependencies
"""
        
        for cycle in self.mapping['dependencies']['circular_deps']:
            report += f"- {' → '.join(cycle)}\n"
            
        return report


if __name__ == '__main__':
    # Simple test
    import sys
    
    if len(sys.argv) > 1:
        workspace_path = sys.argv[1]
    else:
        workspace_path = '.'
        
    mapper = WorkspaceMapper(workspace_path)
    mapping = mapper.build_mapping()
    mapper.save_mapping('workspace_mapping.json')
    
    print(mapper.generate_summary_report())
