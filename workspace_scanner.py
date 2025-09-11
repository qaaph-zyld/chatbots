#!/usr/bin/env python3
"""
Workspace Structure Scanner with Token Calculator
Generates comprehensive context mapping for AI coders with token usage tracking.
Optimized for Claude Sonnet 4 context window management.
"""

import os
import json
import hashlib
import mimetypes
import tiktoken
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse
import sys

class TokenCalculator:
    """Token calculator optimized for Claude models"""
    
    def __init__(self, model_name: str = "gpt-4"):
        try:
            self.encoding = tiktoken.encoding_for_model(model_name)
        except KeyError:
            # Fallback to cl100k_base for Claude-like models
            self.encoding = tiktoken.get_encoding("cl100k_base")
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))

class WorkspaceScanner:
    """Comprehensive workspace structure scanner"""
    
    def __init__(self, max_file_size: int = 1024*1024, max_tokens_per_file: int = 4000):
        self.max_file_size = max_file_size  # 1MB default
        self.max_tokens_per_file = max_tokens_per_file
        self.token_calculator = TokenCalculator()
        
        # File extensions to analyze content
        self.code_extensions = {
            '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.h',
            '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
            '.html', '.htm', '.css', '.scss', '.sass', '.less', '.vue',
            '.json', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg',
            '.md', '.txt', '.rst', '.tex', '.sql', '.sh', '.bat', '.ps1',
            '.dockerfile', '.makefile', '.cmake', '.gradle'
        }
        
        # Ignore patterns
        self.ignore_patterns = {
            '__pycache__', '.git', '.svn', '.hg', 'node_modules',
            '.vscode', '.idea', '.DS_Store', 'Thumbs.db',
            '*.pyc', '*.pyo', '*.pyd', '.pytest_cache',
            'venv', 'env', '.env', 'dist', 'build'
        }
        
        # Binary extensions to skip content reading
        self.binary_extensions = {
            '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico',
            '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac',
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
            '.zip', '.tar', '.gz', '.rar', '.7z'
        }
    
    def should_ignore(self, path: str) -> bool:
        """Check if path should be ignored"""
        path_lower = path.lower()
        for pattern in self.ignore_patterns:
            if pattern.startswith('*'):
                if path_lower.endswith(pattern[1:]):
                    return True
            else:
                if pattern in path_lower:
                    return True
        return False
    
    def get_file_info(self, file_path: Path) -> Dict:
        """Extract comprehensive file information"""
        try:
            stat = file_path.stat()
            file_info = {
                'name': file_path.name,
                'path': str(file_path),
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'extension': file_path.suffix.lower(),
                'mime_type': mimetypes.guess_type(str(file_path))[0],
                'is_binary': file_path.suffix.lower() in self.binary_extensions,
                'token_count': 0,
                'content_preview': None,
                'full_content': None,
                'hash': None
            }
            
            # Skip large files
            if stat.st_size > self.max_file_size:
                file_info['content_preview'] = f"[FILE TOO LARGE: {stat.st_size} bytes]"
                return file_info
            
            # Read content for text files
            if (file_path.suffix.lower() in self.code_extensions and 
                not file_info['is_binary']):
                
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    # Calculate hash
                    file_info['hash'] = hashlib.sha256(content.encode()).hexdigest()[:16]
                    
                    # Count tokens
                    token_count = self.token_calculator.count_tokens(content)
                    file_info['token_count'] = token_count
                    
                    # Store content based on token count
                    if token_count <= self.max_tokens_per_file:
                        file_info['full_content'] = content
                    else:
                        # Store truncated preview
                        lines = content.split('\n')
                        preview_lines = []
                        preview_tokens = 0
                        
                        for line in lines:
                            line_tokens = self.token_calculator.count_tokens(line)
                            if preview_tokens + line_tokens > self.max_tokens_per_file // 2:
                                break
                            preview_lines.append(line)
                            preview_tokens += line_tokens
                        
                        file_info['content_preview'] = '\n'.join(preview_lines)
                        file_info['content_preview'] += f"\n\n[TRUNCATED - Full file has {token_count} tokens]"
                    
                except Exception as e:
                    file_info['content_preview'] = f"[ERROR READING FILE: {str(e)}]"
            
            return file_info
            
        except Exception as e:
            return {
                'name': file_path.name,
                'path': str(file_path),
                'error': str(e)
            }
    
    def scan_directory(self, directory: Path) -> Dict:
        """Recursively scan directory structure"""
        if self.should_ignore(str(directory)):
            return None
        
        try:
            dir_info = {
                'name': directory.name,
                'path': str(directory),
                'type': 'directory',
                'children': [],
                'files': [],
                'total_files': 0,
                'total_tokens': 0,
                'total_size': 0
            }
            
            # Get directory contents
            items = []
            try:
                items = sorted(directory.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
            except PermissionError:
                dir_info['error'] = "Permission denied"
                return dir_info
            
            # Process each item
            for item in items:
                if self.should_ignore(str(item)):
                    continue
                
                if item.is_file():
                    file_info = self.get_file_info(item)
                    dir_info['files'].append(file_info)
                    dir_info['total_files'] += 1
                    dir_info['total_size'] += file_info.get('size', 0)
                    dir_info['total_tokens'] += file_info.get('token_count', 0)
                
                elif item.is_dir():
                    subdir_info = self.scan_directory(item)
                    if subdir_info:
                        dir_info['children'].append(subdir_info)
                        dir_info['total_files'] += subdir_info.get('total_files', 0)
                        dir_info['total_size'] += subdir_info.get('total_size', 0)
                        dir_info['total_tokens'] += subdir_info.get('total_tokens', 0)
            
            return dir_info
            
        except Exception as e:
            return {
                'name': directory.name if hasattr(directory, 'name') else str(directory),
                'path': str(directory),
                'type': 'directory',
                'error': str(e)
            }
    
    def generate_summary(self, structure: Dict) -> Dict:
        """Generate workspace summary"""
        def count_by_extension(node: Dict) -> Dict:
            counts = {}
            if node.get('type') == 'directory':
                for file_info in node.get('files', []):
                    ext = file_info.get('extension', 'no_extension')
                    counts[ext] = counts.get(ext, 0) + 1
                
                for child in node.get('children', []):
                    child_counts = count_by_extension(child)
                    for ext, count in child_counts.items():
                        counts[ext] = counts.get(ext, 0) + count
            
            return counts
        
        file_types = count_by_extension(structure)
        
        summary = {
            'scan_timestamp': datetime.now().isoformat(),
            'workspace_root': structure.get('path', ''),
            'total_files': structure.get('total_files', 0),
            'total_size_bytes': structure.get('total_size', 0),
            'total_tokens': structure.get('total_tokens', 0),
            'file_types': file_types,
            'largest_files': [],
            'highest_token_files': []
        }
        
        return summary
    
    def find_notable_files(self, structure: Dict, summary: Dict):
        """Find largest and highest token files"""
        all_files = []
        
        def collect_files(node: Dict):
            if node.get('type') == 'directory':
                all_files.extend(node.get('files', []))
                for child in node.get('children', []):
                    collect_files(child)
        
        collect_files(structure)
        
        # Sort by size and tokens
        by_size = sorted([f for f in all_files if 'size' in f], 
                        key=lambda x: x['size'], reverse=True)[:10]
        by_tokens = sorted([f for f in all_files if 'token_count' in f], 
                          key=lambda x: x['token_count'], reverse=True)[:10]
        
        summary['largest_files'] = [{'name': f['name'], 'path': f['path'], 
                                   'size': f['size']} for f in by_size]
        summary['highest_token_files'] = [{'name': f['name'], 'path': f['path'], 
                                         'tokens': f['token_count']} for f in by_tokens]
    
    def scan_workspace(self, workspace_path: str) -> Dict:
        """Main scanning function"""
        workspace = Path(workspace_path).resolve()
        
        if not workspace.exists():
            raise FileNotFoundError(f"Workspace path does not exist: {workspace_path}")
        
        if not workspace.is_dir():
            raise NotADirectoryError(f"Path is not a directory: {workspace_path}")
        
        print(f"Scanning workspace: {workspace}")
        print("This may take a while for large projects...")
        
        # Scan structure
        structure = self.scan_directory(workspace)
        
        # Generate summary
        summary = self.generate_summary(structure)
        self.find_notable_files(structure, summary)
        
        # Create final output
        output = {
            'metadata': {
                'scanner_version': '1.0.0',
                'claude_model': 'claude-sonnet-4',
                'max_context_tokens': 200000,  # Claude Sonnet 4 context window
                'scan_date': datetime.now().isoformat()
            },
            'summary': summary,
            'structure': structure
        }
        
        return output

def main():
    parser = argparse.ArgumentParser(description='Workspace Structure Scanner for AI Coders')
    parser.add_argument('workspace', help='Path to workspace directory')
    parser.add_argument('-o', '--output', help='Output JSON file path', 
                       default='workspace_structure.json')
    parser.add_argument('--max-file-size', type=int, default=1024*1024,
                       help='Maximum file size to read (bytes)')
    parser.add_argument('--max-tokens-per-file', type=int, default=4000,
                       help='Maximum tokens per file to include full content')
    parser.add_argument('--compact', action='store_true',
                       help='Generate compact JSON output')
    
    args = parser.parse_args()
    
    try:
        scanner = WorkspaceScanner(
            max_file_size=args.max_file_size,
            max_tokens_per_file=args.max_tokens_per_file
        )
        
        result = scanner.scan_workspace(args.workspace)
        
        # Calculate final output tokens
        output_text = json.dumps(result, indent=None if args.compact else 2)
        final_tokens = scanner.token_calculator.count_tokens(output_text)
        
        result['metadata']['output_tokens'] = final_tokens
        result['metadata']['fits_in_context'] = final_tokens < 180000  # Leave buffer
        
        # Write output
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=None if args.compact else 2, ensure_ascii=False)
        
        # Print summary
        print(f"\n✅ Scan completed successfully!")
        print(f"📁 Total files: {result['summary']['total_files']}")
        print(f"🔢 Total tokens: {result['summary']['total_tokens']:,}")
        print(f"📄 Output tokens: {final_tokens:,}")
        print(f"🎯 Fits in Claude context: {'✅ Yes' if result['metadata']['fits_in_context'] else '❌ No'}")
        print(f"💾 Output saved to: {args.output}")
        
        if not result['metadata']['fits_in_context']:
            print("\n⚠️  Warning: Output exceeds Claude context window.")
            print("Consider using --max-tokens-per-file with a lower value.")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
