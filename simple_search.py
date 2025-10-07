#!/usr/bin/env python3
"""
Simple Search Module for Workspace Mapper
=========================================

Provides basic text-based search functionality without requiring external APIs.

Author: Workspace Analysis Framework
Version: 1.0.0
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import logging


@dataclass
class SimpleSearchResult:
    """Represents a simple search result."""
    file_path: str
    content: str
    line_number: int
    match_context: str
    relevance_score: float


class SimpleWorkspaceSearch:
    """
    Simple text-based search for workspace without requiring AI APIs.
    """
    
    def __init__(self, workspace_path: str, mapping_path: Optional[str] = None):
        """Initialize the simple search engine."""
        self.workspace_path = Path(workspace_path)
        self.mapping = {}
        self.logger = logging.getLogger(__name__)
        
        # Load workspace mapping if provided
        if mapping_path and Path(mapping_path).exists():
            try:
                with open(mapping_path, 'r', encoding='utf-8') as f:
                    self.mapping = json.load(f)
                self.logger.info(f"Loaded mapping with {len(self.mapping.get('structure', {}).get('files', []))} files")
            except Exception as e:
                self.logger.error(f"Failed to load mapping: {e}")
                
    def search_files(self, query: str, file_types: Optional[List[str]] = None, 
                    max_results: int = 10) -> List[SimpleSearchResult]:
        """Search for files containing the query text."""
        results = []
        query_lower = query.lower()
        
        # Search in mapping if available
        if self.mapping and 'structure' in self.mapping:
            files = self.mapping['structure']['files']
            
            for file_info in files:
                # Filter by file type if specified
                if file_types and file_info.get('type') not in file_types:
                    continue
                    
                file_path = Path(self.workspace_path) / file_info['path']
                
                # Skip binary files
                if file_info.get('is_binary', False):
                    continue
                    
                try:
                    content = self._read_file_safely(file_path)
                    if content and query_lower in content.lower():
                        # Find matching lines
                        lines = content.split('\n')
                        for i, line in enumerate(lines, 1):
                            if query_lower in line.lower():
                                # Calculate relevance score
                                score = self._calculate_relevance(query, line, file_info)
                                
                                # Get context around the match
                                context = self._get_line_context(lines, i-1, context_size=2)
                                
                                result = SimpleSearchResult(
                                    file_path=file_info['path'],
                                    content=line.strip(),
                                    line_number=i,
                                    match_context=context,
                                    relevance_score=score
                                )
                                results.append(result)
                                
                except Exception as e:
                    self.logger.debug(f"Error searching file {file_path}: {e}")
                    
        # Sort by relevance score
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        return results[:max_results]
        
    def search_by_file_type(self, query: str, file_type: str, 
                           max_results: int = 10) -> List[SimpleSearchResult]:
        """Search within specific file types."""
        return self.search_files(query, [file_type], max_results)
        
    def find_functions(self, function_name: str, 
                      max_results: int = 10) -> List[SimpleSearchResult]:
        """Find function definitions."""
        results = []
        
        if not self.mapping or 'structure' not in self.mapping:
            return results
            
        for file_info in self.mapping['structure']['files']:
            # Check if function is in the extracted functions list
            if function_name in file_info.get('functions', []):
                file_path = Path(self.workspace_path) / file_info['path']
                
                try:
                    content = self._read_file_safely(file_path)
                    if content:
                        # Find the actual function definition line
                        lines = content.split('\n')
                        for i, line in enumerate(lines, 1):
                            # Simple function detection patterns
                            patterns = [
                                rf'function\s+{re.escape(function_name)}\s*\(',
                                rf'const\s+{re.escape(function_name)}\s*=',
                                rf'def\s+{re.escape(function_name)}\s*\(',
                                rf'{re.escape(function_name)}\s*:\s*function',
                            ]
                            
                            for pattern in patterns:
                                if re.search(pattern, line, re.IGNORECASE):
                                    context = self._get_line_context(lines, i-1, context_size=5)
                                    
                                    result = SimpleSearchResult(
                                        file_path=file_info['path'],
                                        content=line.strip(),
                                        line_number=i,
                                        match_context=context,
                                        relevance_score=1.0  # High relevance for exact function matches
                                    )
                                    results.append(result)
                                    break
                                    
                except Exception as e:
                    self.logger.debug(f"Error searching for function in {file_path}: {e}")
                    
        return results[:max_results]
        
    def find_imports(self, module_name: str, 
                    max_results: int = 10) -> List[SimpleSearchResult]:
        """Find files that import a specific module."""
        results = []
        
        if not self.mapping or 'structure' not in self.mapping:
            return results
            
        for file_info in self.mapping['structure']['files']:
            # Check if module is in the imports list
            imports = file_info.get('imports', [])
            if any(module_name in imp for imp in imports):
                file_path = Path(self.workspace_path) / file_info['path']
                
                try:
                    content = self._read_file_safely(file_path)
                    if content:
                        lines = content.split('\n')
                        for i, line in enumerate(lines, 1):
                            if module_name in line and ('import' in line or 'require' in line):
                                context = self._get_line_context(lines, i-1, context_size=2)
                                
                                result = SimpleSearchResult(
                                    file_path=file_info['path'],
                                    content=line.strip(),
                                    line_number=i,
                                    match_context=context,
                                    relevance_score=0.9
                                )
                                results.append(result)
                                
                except Exception as e:
                    self.logger.debug(f"Error searching for imports in {file_path}: {e}")
                    
        return results[:max_results]
        
    def get_file_info(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific file."""
        if not self.mapping or 'structure' not in self.mapping:
            return None
            
        for file_info in self.mapping['structure']['files']:
            if file_info['path'] == file_path:
                return file_info
                
        return None
        
    def get_project_statistics(self) -> Dict[str, Any]:
        """Get project statistics from the mapping."""
        if not self.mapping:
            return {}
            
        stats = self.mapping.get('statistics', {})
        analysis = self.mapping.get('analysis', {})
        
        return {
            'total_files': stats.get('total_files', 0),
            'total_directories': stats.get('total_directories', 0),
            'file_types': dict(stats.get('file_types', {})),
            'test_files': len(analysis.get('test_files', [])),
            'config_files': len(analysis.get('config_files', [])),
            'documentation_files': len(analysis.get('documentation', [])),
            'api_endpoints': len(analysis.get('api_endpoints', [])),
            'circular_dependencies': len(self.mapping.get('dependencies', {}).get('circular_deps', []))
        }
        
    def _read_file_safely(self, file_path: Path) -> Optional[str]:
        """Safely read file content with encoding detection."""
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except (UnicodeDecodeError, UnicodeError):
                continue
            except (OSError, IOError):
                return None
                
        return None
        
    def _calculate_relevance(self, query: str, line: str, file_info: Dict) -> float:
        """Calculate relevance score for a search result."""
        score = 0.0
        query_lower = query.lower()
        line_lower = line.lower()
        
        # Exact match gets highest score
        if query_lower == line_lower.strip():
            score += 1.0
        elif query_lower in line_lower:
            score += 0.8
            
        # Bonus for matches in function names, class names, etc.
        if any(query_lower in func.lower() for func in file_info.get('functions', [])):
            score += 0.3
        if any(query_lower in cls.lower() for cls in file_info.get('classes', [])):
            score += 0.3
            
        # Bonus for matches in important file types
        file_type = file_info.get('type', '')
        if file_type in ['javascript', 'typescript', 'python']:
            score += 0.1
        elif file_type in ['configuration', 'package_json']:
            score += 0.2
            
        # Penalty for very long lines (likely minified or generated)
        if len(line) > 200:
            score *= 0.5
            
        return min(score, 1.0)  # Cap at 1.0
        
    def _get_line_context(self, lines: List[str], line_index: int, 
                         context_size: int = 2) -> str:
        """Get context around a specific line."""
        start = max(0, line_index - context_size)
        end = min(len(lines), line_index + context_size + 1)
        
        context_lines = []
        for i in range(start, end):
            marker = ">>>" if i == line_index else "   "
            context_lines.append(f"{marker} {i+1:4d}: {lines[i]}")
            
        return '\n'.join(context_lines)


def main():
    """Simple test of the search functionality."""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python simple_search.py <query> [workspace_path] [mapping_path]")
        sys.exit(1)
        
    query = sys.argv[1]
    workspace_path = sys.argv[2] if len(sys.argv) > 2 else '.'
    mapping_path = sys.argv[3] if len(sys.argv) > 3 else 'workspace_mapping.json'
    
    # Initialize search
    search = SimpleWorkspaceSearch(workspace_path, mapping_path)
    
    # Perform search
    results = search.search_files(query, max_results=5)
    
    print(f"🔍 Search results for '{query}':")
    print(f"Found {len(results)} matches\n")
    
    for i, result in enumerate(results, 1):
        print(f"📄 Result {i}: {result.file_path}")
        print(f"   Line {result.line_number}: {result.content}")
        print(f"   Score: {result.relevance_score:.2f}")
        print()
        
    # Show statistics
    stats = search.get_project_statistics()
    if stats:
        print("📊 Project Statistics:")
        print(f"   Files: {stats['total_files']}")
        print(f"   Test files: {stats['test_files']}")
        print(f"   API endpoints: {stats['api_endpoints']}")


if __name__ == '__main__':
    main()
