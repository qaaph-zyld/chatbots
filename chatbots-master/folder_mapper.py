#!/usr/bin/env python3
"""
Comprehensive Folder Structure Mapper
=====================================
Advanced Python script for automated folder/file mapping with intelligent descriptions.
Generates extensive documentation with mandatory descriptions for all entries.
"""

import os
import zipfile
import tempfile
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import mimetypes
import json
import logging
from collections import defaultdict
import hashlib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('folder_mapper.log'),
        logging.StreamHandler()
    ]
)

class FolderMapper:
    """
    Advanced folder structure mapper with automated description generation.
    """
    
    def __init__(self, zip_path: str, output_path: str = "folder_mapping.md"):
        """
        Initialize the folder mapper.
        
        Args:
            zip_path (str): Path to the zip file to analyze
            output_path (str): Output markdown file path
        """
        self.zip_path = Path(zip_path)
        self.output_path = Path(output_path)
        self.temp_dir = None
        self.extracted_path = None
        self.structure_data = {}
        self.file_stats = defaultdict(int)
        self.total_files = 0
        self.total_folders = 0
        
        # File type mappings for intelligent descriptions
        self.file_type_descriptions = {
            '.py': 'Python source code module',
            '.js': 'JavaScript application script',
            '.html': 'HTML markup document',
            '.css': 'Cascading Style Sheets file',
            '.json': 'JSON configuration/data file',
            '.md': 'Markdown documentation file',
            '.txt': 'Plain text document',
            '.yml': 'YAML configuration file',
            '.yaml': 'YAML configuration file',
            '.xml': 'XML structured data file',
            '.csv': 'Comma-separated values data file',
            '.sql': 'SQL database script',
            '.sh': 'Shell script executable',
            '.bat': 'Windows batch script',
            '.dockerfile': 'Docker container configuration',
            '.gitignore': 'Git ignore patterns file',
            '.env': 'Environment variables configuration',
            '.conf': 'Configuration settings file',
            '.ini': 'Initialization configuration file',
            '.log': 'Application log file',
            '.lock': 'Dependency lock file',
            '.requirements': 'Python requirements specification',
            '.pip': 'Python package index file'
        }
        
        # Common folder patterns and their descriptions
        self.folder_patterns = {
            'src': 'Source code directory containing main application files',
            'lib': 'Library directory with reusable code modules',
            'bin': 'Binary executables and compiled programs',
            'docs': 'Documentation and reference materials',
            'tests': 'Unit tests and testing framework files',
            'test': 'Testing directory with test cases and fixtures',
            'config': 'Configuration files and settings',
            'data': 'Data files and datasets',
            'assets': 'Static assets like images, fonts, and media files',
            'static': 'Static web assets for frontend applications',
            'templates': 'Template files for dynamic content generation',
            'migrations': 'Database migration scripts',
            'models': 'Data model definitions and schemas',
            'views': 'View layer components and templates',
            'controllers': 'Controller logic and request handlers',
            'utils': 'Utility functions and helper modules',
            'helpers': 'Helper functions and auxiliary code',
            'scripts': 'Automation scripts and build tools',
            'build': 'Build artifacts and compiled output',
            'dist': 'Distribution files and packaged applications',
            'node_modules': 'Node.js dependencies and packages',
            'venv': 'Python virtual environment',
            'env': 'Environment-specific configuration',
            '__pycache__': 'Python bytecode cache directory',
            '.git': 'Git version control metadata',
            '.github': 'GitHub workflow and configuration files',
            'api': 'API endpoint definitions and handlers',
            'components': 'Reusable UI components',
            'services': 'Service layer implementations',
            'middleware': 'Middleware components and interceptors',
            'routes': 'URL routing definitions',
            'database': 'Database-related files and schemas',
            'logs': 'Application log files directory',
            'temp': 'Temporary files and cache storage',
            'backup': 'Backup files and recovery data',
            'vendor': 'Third-party vendor libraries'
        }
    
    def extract_zip(self) -> bool:
        """
        Extract the zip file to a temporary directory.
        
        Returns:
            bool: True if extraction successful, False otherwise
        """
        try:
            if not self.zip_path.exists():
                logging.error(f"Zip file not found: {self.zip_path}")
                return False
            
            self.temp_dir = tempfile.mkdtemp()
            
            with zipfile.ZipFile(self.zip_path, 'r') as zip_ref:
                zip_ref.extractall(self.temp_dir)
            
            # Find the root directory (usually the only directory in temp)
            contents = list(Path(self.temp_dir).iterdir())
            if len(contents) == 1 and contents[0].is_dir():
                self.extracted_path = contents[0]
            else:
                self.extracted_path = Path(self.temp_dir)
            
            logging.info(f"Successfully extracted to: {self.extracted_path}")
            return True
            
        except Exception as e:
            logging.error(f"Failed to extract zip file: {str(e)}")
            return False
    
    def analyze_file_content(self, file_path: Path) -> str:
        """
        Analyze file content to generate intelligent descriptions.
        
        Args:
            file_path (Path): Path to the file to analyze
            
        Returns:
            str: Generated description based on content analysis
        """
        try:
            file_size = file_path.stat().st_size
            file_ext = file_path.suffix.lower()
            
            # Base description from file extension
            base_desc = self.file_type_descriptions.get(file_ext, f"{file_ext.upper()} file")
            
            # Add size information
            if file_size == 0:
                size_desc = "empty file"
            elif file_size < 1024:
                size_desc = f"{file_size} bytes"
            elif file_size < 1024 * 1024:
                size_desc = f"{file_size // 1024}KB"
            else:
                size_desc = f"{file_size // (1024 * 1024)}MB"
            
            # Content-based analysis for specific file types
            content_hint = ""
            if file_ext in ['.py', '.js', '.html', '.css', '.md', '.txt', '.json', '.yml', '.yaml']:
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        first_lines = f.read(500)  # Read first 500 characters
                        
                    if file_ext == '.py':
                        if 'class ' in first_lines:
                            content_hint = "containing class definitions"
                        elif 'def ' in first_lines:
                            content_hint = "containing function definitions"
                        elif 'import ' in first_lines:
                            content_hint = "with import statements"
                        elif '#!/usr/bin/env python' in first_lines:
                            content_hint = "executable Python script"
                    
                    elif file_ext == '.js':
                        if 'function' in first_lines:
                            content_hint = "with function definitions"
                        elif 'const' in first_lines or 'let' in first_lines:
                            content_hint = "with variable declarations"
                        elif 'import' in first_lines:
                            content_hint = "with ES6 imports"
                    
                    elif file_ext == '.json':
                        if 'package' in first_lines and 'version' in first_lines:
                            content_hint = "package.json configuration"
                        elif 'dependencies' in first_lines:
                            content_hint = "dependency configuration"
                        elif 'config' in first_lines:
                            content_hint = "configuration data"
                    
                    elif file_ext == '.md':
                        if '# ' in first_lines:
                            content_hint = "with headers and documentation"
                        elif 'README' in file_path.name.upper():
                            content_hint = "project documentation"
                    
                except Exception:
                    pass  # Skip content analysis if file can't be read
            
            # Construct final description
            description_parts = [base_desc]
            if content_hint:
                description_parts.append(content_hint)
            description_parts.append(f"({size_desc})")
            
            return " ".join(description_parts)
            
        except Exception as e:
            logging.warning(f"Error analyzing file {file_path}: {str(e)}")
            return f"File ({file_path.suffix} format)"
    
    def generate_folder_description(self, folder_path: Path) -> str:
        """
        Generate intelligent description for folders based on name and contents.
        
        Args:
            folder_path (Path): Path to the folder
            
        Returns:
            str: Generated folder description
        """
        folder_name = folder_path.name.lower()
        
        # Check for exact matches first
        if folder_name in self.folder_patterns:
            base_desc = self.folder_patterns[folder_name]
        else:
            # Check for partial matches
            base_desc = None
            for pattern, desc in self.folder_patterns.items():
                if pattern in folder_name or folder_name in pattern:
                    base_desc = desc
                    break
            
            if not base_desc:
                base_desc = f"Directory containing {folder_name}-related files"
        
        # Analyze contents to enhance description
        try:
            contents = list(folder_path.iterdir())
            file_count = len([f for f in contents if f.is_file()])
            dir_count = len([f for f in contents if f.is_dir()])
            
            # Analyze file types in the folder
            file_types = set()
            for item in contents:
                if item.is_file():
                    file_types.add(item.suffix.lower())
            
            content_desc = f"({file_count} files, {dir_count} subdirectories)"
            
            # Add file type information
            if file_types:
                common_types = [ext for ext in file_types if ext in self.file_type_descriptions]
                if common_types:
                    if len(common_types) == 1:
                        content_desc += f" - primarily {common_types[0]} files"
                    elif len(common_types) <= 3:
                        content_desc += f" - contains {', '.join(common_types)} files"
                    else:
                        content_desc += f" - mixed file types"
            
            return f"{base_desc} {content_desc}"
            
        except Exception as e:
            logging.warning(f"Error analyzing folder {folder_path}: {str(e)}")
            return base_desc
    
    def map_directory_structure(self, path: Path, level: int = 0) -> Dict:
        """
        Recursively map directory structure with descriptions.
        
        Args:
            path (Path): Directory path to map
            level (int): Current nesting level
            
        Returns:
            Dict: Structured mapping data
        """
        try:
            items = []
            
            # Get all items in the directory
            try:
                all_items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
            except PermissionError:
                logging.warning(f"Permission denied accessing: {path}")
                return {"items": [], "error": "Permission denied"}
            
            for item in all_items:
                try:
                    if item.is_dir():
                        self.total_folders += 1
                        folder_desc = self.generate_folder_description(item)
                        
                        # Recursively map subdirectories
                        subdirectory_data = self.map_directory_structure(item, level + 1)
                        
                        items.append({
                            "type": "directory",
                            "name": item.name,
                            "path": str(item.relative_to(self.extracted_path)),
                            "description": folder_desc,
                            "level": level,
                            "contents": subdirectory_data
                        })
                    
                    elif item.is_file():
                        self.total_files += 1
                        file_desc = self.analyze_file_content(item)
                        
                        # Track file statistics
                        self.file_stats[item.suffix.lower()] += 1
                        
                        items.append({
                            "type": "file",
                            "name": item.name,
                            "path": str(item.relative_to(self.extracted_path)),
                            "description": file_desc,
                            "level": level,
                            "size": item.stat().st_size,
                            "modified": datetime.fromtimestamp(item.stat().st_mtime).isoformat()
                        })
                
                except Exception as e:
                    logging.warning(f"Error processing item {item}: {str(e)}")
                    continue
            
            return {"items": items}
            
        except Exception as e:
            logging.error(f"Error mapping directory {path}: {str(e)}")
            return {"items": [], "error": str(e)}
    
    def generate_markdown_output(self, structure_data: Dict) -> str:
        """
        Generate comprehensive markdown documentation.
        
        Args:
            structure_data (Dict): Mapped structure data
            
        Returns:
            str: Generated markdown content
        """
        markdown_lines = []
        
        # Header
        markdown_lines.extend([
            "# Comprehensive Folder Structure Mapping",
            "",
            f"**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**Source:** {self.zip_path.name}",
            f"**Total Files:** {self.total_files:,}",
            f"**Total Folders:** {self.total_folders:,}",
            "",
            "## Project Overview",
            "",
            f"This document provides a comprehensive mapping of the `{self.zip_path.stem}` project structure.",
            "Every folder and file includes a mandatory description based on automated analysis.",
            "",
            "## File Type Distribution",
            ""
        ])
        
        # File statistics
        if self.file_stats:
            markdown_lines.append("| File Type | Count | Description |")
            markdown_lines.append("|-----------|-------|-------------|")
            
            for ext, count in sorted(self.file_stats.items(), key=lambda x: x[1], reverse=True):
                desc = self.file_type_descriptions.get(ext, f"{ext.upper()} files")
                markdown_lines.append(f"| `{ext if ext else 'no extension'}` | {count:,} | {desc} |")
        
        markdown_lines.extend([
            "",
            "## Detailed Structure Mapping",
            "",
            "### Directory Tree with Descriptions",
            ""
        ])
        
        # Generate tree structure
        def generate_tree_section(items: List[Dict], level: int = 0) -> None:
            for item in items:
                indent = "  " * level
                
                if item["type"] == "directory":
                    # Directory entry
                    markdown_lines.append(f"{indent}📁 **{item['name']}/**")
                    markdown_lines.append(f"{indent}   *{item['description']}*")
                    markdown_lines.append(f"{indent}   - Path: `{item['path']}`")
                    markdown_lines.append("")
                    
                    # Process subdirectories and files
                    if "contents" in item and "items" in item["contents"]:
                        generate_tree_section(item["contents"]["items"], level + 1)
                
                elif item["type"] == "file":
                    # File entry
                    size_mb = item.get("size", 0) / (1024 * 1024)
                    size_str = f"{size_mb:.2f}MB" if size_mb >= 1 else f"{item.get('size', 0) / 1024:.1f}KB"
                    
                    markdown_lines.append(f"{indent}📄 **{item['name']}**")
                    markdown_lines.append(f"{indent}   *{item['description']}*")
                    markdown_lines.append(f"{indent}   - Path: `{item['path']}`")
                    markdown_lines.append(f"{indent}   - Size: {size_str}")
                    if item.get("modified"):
                        markdown_lines.append(f"{indent}   - Modified: {item['modified']}")
                    markdown_lines.append("")
        
        # Generate the tree
        if "items" in structure_data:
            generate_tree_section(structure_data["items"])
        
        # Add summary section
        markdown_lines.extend([
            "",
            "## Summary",
            "",
            f"- **Total Entries Mapped:** {self.total_files + self.total_folders:,}",
            f"- **Files:** {self.total_files:,}",
            f"- **Directories:** {self.total_folders:,}",
            f"- **Unique File Types:** {len(self.file_stats)}",
            "",
            "All entries include mandatory descriptions generated through automated analysis of:",
            "- File content and structure",
            "- Naming conventions and patterns",
            "- Directory contents and organization",
            "- File size and modification metadata",
            "",
            "---",
            "*Generated by Advanced Folder Structure Mapper*"
        ])
        
        return "\n".join(markdown_lines)
    
    def execute_mapping(self) -> bool:
        """
        Execute the complete mapping process.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            logging.info("Starting folder structure mapping process...")
            
            # Step 1: Extract zip file
            if not self.extract_zip():
                return False
            
            # Step 2: Map directory structure
            logging.info("Analyzing directory structure...")
            self.structure_data = self.map_directory_structure(self.extracted_path)
            
            # Step 3: Generate markdown output
            logging.info("Generating markdown documentation...")
            markdown_content = self.generate_markdown_output(self.structure_data)
            
            # Step 4: Write output file
            with open(self.output_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            logging.info(f"Successfully generated mapping file: {self.output_path}")
            logging.info(f"Mapped {self.total_files:,} files and {self.total_folders:,} folders")
            
            return True
            
        except Exception as e:
            logging.error(f"Error during mapping execution: {str(e)}")
            return False
        
        finally:
            # Cleanup temporary directory
            if self.temp_dir and os.path.exists(self.temp_dir):
                shutil.rmtree(self.temp_dir)
                logging.info("Cleaned up temporary files")
    
    def generate_json_output(self, json_path: str = "folder_structure.json") -> bool:
        """
        Generate JSON output for programmatic access.
        
        Args:
            json_path (str): Output JSON file path
            
        Returns:
            bool: True if successful
        """
        try:
            output_data = {
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "source_file": str(self.zip_path),
                    "total_files": self.total_files,
                    "total_folders": self.total_folders,
                    "file_statistics": dict(self.file_stats)
                },
                "structure": self.structure_data
            }
            
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logging.info(f"JSON output saved to: {json_path}")
            return True
            
        except Exception as e:
            logging.error(f"Error generating JSON output: {str(e)}")
            return False


def main():
    """
    Main execution function with command-line interface.
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Advanced Folder Structure Mapper with Automated Descriptions"
    )
    parser.add_argument(
        "zip_path",
        help="Path to the zip file to analyze"
    )
    parser.add_argument(
        "-o", "--output",
        default="folder_mapping.md",
        help="Output markdown file path (default: folder_mapping.md)"
    )
    parser.add_argument(
        "-j", "--json",
        action="store_true",
        help="Also generate JSON output"
    )
    parser.add_argument(
        "--json-path",
        default="folder_structure.json",
        help="JSON output file path (default: folder_structure.json)"
    )
    
    args = parser.parse_args()
    
    # Initialize and execute mapper
    mapper = FolderMapper(args.zip_path, args.output)
    
    if mapper.execute_mapping():
        print(f"✅ Successfully generated folder mapping: {args.output}")
        
        if args.json:
            if mapper.generate_json_output(args.json_path):
                print(f"✅ JSON output generated: {args.json_path}")
            else:
                print("❌ Failed to generate JSON output")
        
        print(f"\n📊 Summary:")
        print(f"   Files mapped: {mapper.total_files:,}")
        print(f"   Folders mapped: {mapper.total_folders:,}")
        print(f"   File types: {len(mapper.file_stats)}")
        
    else:
        print("❌ Failed to generate folder mapping")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
