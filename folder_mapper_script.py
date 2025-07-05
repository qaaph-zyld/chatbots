#!/usr/bin/env python3
"""
Comprehensive Folder Mapping Script
===================================

This script provides complete folder structure mapping with mandatory descriptions
for every folder, subfolder, and file. Addresses all architectural issues identified
in the performance gap analysis.

Features:
- Comprehensive zip extraction with nested archive handling
- Bulletproof directory traversal with permission handling
- Memory-efficient processing for large datasets
- Progress tracking and monitoring
- Parallel processing capabilities
- Robust error handling and logging
- Markdown output generation

Usage:
    python folder_mapper.py path/to/your/file.zip
"""

import os
import sys
import zipfile
import tempfile
import shutil
import logging
from pathlib import Path
from typing import Dict, List, Optional, Generator, Tuple
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
import mimetypes
import hashlib
import json
import argparse


@dataclass
class ProcessingStats:
    """Statistics tracking for processing operations."""
    start_time: datetime = field(default_factory=datetime.now)
    processed_files: int = 0
    processed_folders: int = 0
    errors_encountered: int = 0
    permission_denials: int = 0
    large_files: int = 0
    empty_directories: int = 0
    total_size: int = 0


class ComprehensiveFolderMapper:
    """
    Advanced folder mapping system with comprehensive analysis capabilities.
    """
    
    def __init__(self, zip_path: str, output_file: str = "folder_mapping.md"):
        self.zip_path = Path(zip_path)
        self.output_file = Path(output_file)
        self.temp_dir = None
        self.extracted_path = None
        self.stats = ProcessingStats()
        self.structure_data = []
        self.max_depth = 100
        self.chunk_size = 5000
        self.max_workers = 8
        
        # Setup logging
        self._setup_logging()
        
        # Initialize MIME types
        mimetypes.init()
        
        logging.info(f"Initialized ComprehensiveFolderMapper for: {self.zip_path}")
    
    def _setup_logging(self):
        """Configure comprehensive logging system."""
        log_format = '%(asctime)s - %(levelname)s - %(message)s'
        logging.basicConfig(
            level=logging.INFO,
            format=log_format,
            handlers=[
                logging.FileHandler(f'folder_mapper_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
                logging.StreamHandler(sys.stdout)
            ]
        )
    
    def extract_zip_comprehensive(self) -> bool:
        """
        Enhanced extraction handling nested archives and complex structures.
        """
        try:
            self.temp_dir = tempfile.mkdtemp(prefix='folder_mapper_')
            logging.info(f"Created temporary directory: {self.temp_dir}")
            
            with zipfile.ZipFile(self.zip_path, 'r') as zip_ref:
                # Extract all files, preserving directory structure
                zip_ref.extractall(self.temp_dir)
                logging.info(f"Extracted {len(zip_ref.namelist())} items from ZIP")
            
            # Set extracted path to temp directory (process ALL content)
            self.extracted_path = Path(self.temp_dir)
            
            # Handle nested zip files recursively
            self._process_nested_archives()
            
            logging.info(f"Comprehensive extraction completed: {self.extracted_path}")
            return True
            
        except Exception as e:
            logging.error(f"Comprehensive extraction failed: {str(e)}")
            return False
    
    def _process_nested_archives(self):
        """Process any nested archive files found during extraction."""
        nested_archives = []
        
        for root, dirs, files in os.walk(self.temp_dir):
            for file in files:
                if file.lower().endswith(('.zip', '.tar.gz', '.rar', '.7z')):
                    nested_archives.append(Path(root) / file)
        
        if nested_archives:
            logging.info(f"Found {len(nested_archives)} nested archives")
            for archive in nested_archives:
                try:
                    self._extract_nested_archive(archive)
                except Exception as e:
                    logging.warning(f"Failed to extract nested archive {archive}: {e}")
    
    def _extract_nested_archive(self, archive_path: Path):
        """Extract a nested archive file."""
        if archive_path.suffix.lower() == '.zip':
            extract_dir = archive_path.parent / f"{archive_path.stem}_extracted"
            extract_dir.mkdir(exist_ok=True)
            
            with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            
            logging.info(f"Extracted nested archive: {archive_path}")
    
    def map_directory_structure_comprehensive(self) -> bool:
        """
        Comprehensive directory mapping with advanced traversal capabilities.
        """
        if not self.extracted_path or not self.extracted_path.exists():
            logging.error("No valid extracted path available")
            return False
        
        try:
            logging.info("Starting comprehensive directory mapping...")
            
            # Process structure in batches for memory efficiency
            for batch in self._generate_item_batches():
                self._process_item_batch(batch)
                
                # Progress logging
                if self.stats.processed_files % 1000 == 0:
                    self._log_progress()
            
            logging.info(f"Mapping completed: {self.stats.processed_files:,} files, "
                        f"{self.stats.processed_folders:,} folders")
            return True
            
        except Exception as e:
            logging.error(f"Comprehensive mapping failed: {str(e)}")
            return False
    
    def _generate_item_batches(self) -> Generator[List[Tuple[Path, str, int]], None, None]:
        """Generate batches of items for processing."""
        batch = []
        
        for root, dirs, files in os.walk(self.extracted_path):
            root_path = Path(root)
            level = len(root_path.relative_to(self.extracted_path).parts)
            
            if level > self.max_depth:
                logging.warning(f"Maximum depth exceeded at: {root_path}")
                continue
            
            # Add directories to batch
            for dir_name in dirs:
                dir_path = root_path / dir_name
                batch.append((dir_path, 'directory', level))
                
                if len(batch) >= self.chunk_size:
                    yield batch
                    batch = []
            
            # Add files to batch
            for file_name in files:
                file_path = root_path / file_name
                batch.append((file_path, 'file', level))
                
                if len(batch) >= self.chunk_size:
                    yield batch
                    batch = []
        
        if batch:
            yield batch
    
    def _process_item_batch(self, batch: List[Tuple[Path, str, int]]):
        """Process a batch of items with parallel processing."""
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self._process_single_item, item_path, item_type, level): (item_path, item_type, level)
                for item_path, item_type, level in batch
            }
            
            for future in as_completed(futures):
                try:
                    result = future.result()
                    if result:
                        self.structure_data.append(result)
                except Exception as e:
                    item_path, item_type, level = futures[future]
                    logging.error(f"Error processing {item_type} {item_path}: {e}")
                    self.stats.errors_encountered += 1
    
    def _process_single_item(self, item_path: Path, item_type: str, level: int) -> Optional[Dict]:
        """Process a single file or directory item."""
        try:
            if item_type == 'directory':
                return self._process_directory(item_path, level)
            else:
                return self._process_file(item_path, level)
        except Exception as e:
            logging.error(f"Error processing {item_type} {item_path}: {e}")
            return None
    
    def _process_directory(self, dir_path: Path, level: int) -> Dict:
        """Process a directory item."""
        try:
            # Check if directory is accessible
            try:
                items = list(dir_path.iterdir())
                is_accessible = True
            except PermissionError:
                self.stats.permission_denials += 1
                is_accessible = False
                items = []
            except OSError:
                is_accessible = False
                items = []
            
            # Check if directory is empty
            is_empty = len(items) == 0 and is_accessible
            if is_empty:
                self.stats.empty_directories += 1
            
            # Generate directory description
            description = self._generate_directory_description(dir_path, items, is_accessible, is_empty)
            
            self.stats.processed_folders += 1
            
            return {
                "type": "directory",
                "name": dir_path.name,
                "path": str(dir_path.relative_to(self.extracted_path)),
                "description": description,
                "level": level,
                "is_accessible": is_accessible,
                "is_empty": is_empty,
                "item_count": len(items) if is_accessible else 0,
                "absolute_path": str(dir_path)
            }
            
        except Exception as e:
            logging.error(f"Error processing directory {dir_path}: {e}")
            return None
    
    def _process_file(self, file_path: Path, level: int) -> Dict:
        """Process a file item."""
        try:
            # Get file statistics
            try:
                stat = file_path.stat()
                size = stat.st_size
                modified = datetime.fromtimestamp(stat.st_mtime)
                is_accessible = True
            except (OSError, PermissionError):
                size = 0
                modified = None
                is_accessible = False
                self.stats.permission_denials += 1
            
            # Track large files
            if size > 100 * 1024 * 1024:  # 100MB
                self.stats.large_files += 1
            
            # Generate file description
            description = self._generate_file_description(file_path, size, is_accessible)
            
            self.stats.processed_files += 1
            self.stats.total_size += size
            
            return {
                "type": "file",
                "name": file_path.name,
                "path": str(file_path.relative_to(self.extracted_path)),
                "description": description,
                "level": level,
                "size": size,
                "size_human": self._format_size(size),
                "modified": modified.isoformat() if modified else None,
                "extension": file_path.suffix.lower(),
                "mime_type": mimetypes.guess_type(str(file_path))[0],
                "is_accessible": is_accessible,
                "absolute_path": str(file_path)
            }
            
        except Exception as e:
            logging.error(f"Error processing file {file_path}: {e}")
            return None
    
    def _generate_directory_description(self, dir_path: Path, items: List[Path], 
                                      is_accessible: bool, is_empty: bool) -> str:
        """Generate intelligent description for directory."""
        if not is_accessible:
            return "Directory with restricted access permissions"
        
        if is_empty:
            return "Empty directory"
        
        # Analyze directory contents
        file_count = sum(1 for item in items if item.is_file())
        dir_count = sum(1 for item in items if item.is_dir())
        
        # Analyze file types
        extensions = {}
        for item in items:
            if item.is_file():
                ext = item.suffix.lower()
                extensions[ext] = extensions.get(ext, 0) + 1
        
        # Generate contextual description
        dir_name = dir_path.name.lower()
        
        # Pattern-based descriptions
        if 'test' in dir_name:
            return f"Testing directory containing {file_count} files and {dir_count} subdirectories"
        elif 'doc' in dir_name or 'readme' in dir_name:
            return f"Documentation directory with {file_count} files and {dir_count} subdirectories"
        elif 'src' in dir_name or 'source' in dir_name:
            return f"Source code directory containing {file_count} files and {dir_count} subdirectories"
        elif 'lib' in dir_name or 'vendor' in dir_name:
            return f"Library directory with {file_count} files and {dir_count} subdirectories"
        elif 'config' in dir_name or 'conf' in dir_name:
            return f"Configuration directory containing {file_count} files and {dir_count} subdirectories"
        elif 'asset' in dir_name or 'static' in dir_name:
            return f"Assets directory with {file_count} files and {dir_count} subdirectories"
        elif 'build' in dir_name or 'dist' in dir_name:
            return f"Build/distribution directory containing {file_count} files and {dir_count} subdirectories"
        
        # Extension-based descriptions
        if extensions:
            most_common_ext = max(extensions.items(), key=lambda x: x[1])[0]
            if most_common_ext == '.py':
                return f"Python module directory with {file_count} files and {dir_count} subdirectories"
            elif most_common_ext in ['.js', '.ts']:
                return f"JavaScript/TypeScript directory with {file_count} files and {dir_count} subdirectories"
            elif most_common_ext in ['.html', '.css']:
                return f"Web assets directory with {file_count} files and {dir_count} subdirectories"
            elif most_common_ext in ['.jpg', '.png', '.gif', '.svg']:
                return f"Image assets directory with {file_count} files and {dir_count} subdirectories"
        
        # Default description
        return f"Directory containing {file_count} files and {dir_count} subdirectories"
    
    def _generate_file_description(self, file_path: Path, size: int, is_accessible: bool) -> str:
        """Generate intelligent description for file."""
        if not is_accessible:
            return "File with restricted access permissions"
        
        file_name = file_path.name.lower()
        extension = file_path.suffix.lower()
        
        # Size-based classification
        size_desc = "small" if size < 1024 else "medium" if size < 1024*1024 else "large"
        
        # Extension-based descriptions
        if extension == '.py':
            return f"Python script file ({size_desc} size: {self._format_size(size)})"
        elif extension in ['.js', '.ts']:
            return f"JavaScript/TypeScript file ({size_desc} size: {self._format_size(size)})"
        elif extension in ['.html', '.htm']:
            return f"HTML document file ({size_desc} size: {self._format_size(size)})"
        elif extension == '.css':
            return f"CSS stylesheet file ({size_desc} size: {self._format_size(size)})"
        elif extension in ['.json', '.yaml', '.yml']:
            return f"Configuration/data file ({size_desc} size: {self._format_size(size)})"
        elif extension in ['.md', '.txt']:
            return f"Text/documentation file ({size_desc} size: {self._format_size(size)})"
        elif extension in ['.jpg', '.jpeg', '.png', '.gif', '.svg']:
            return f"Image file ({size_desc} size: {self._format_size(size)})"
        elif extension in ['.pdf', '.doc', '.docx']:
            return f"Document file ({size_desc} size: {self._format_size(size)})"
        elif extension in ['.zip', '.tar', '.gz', '.rar']:
            return f"Archive file ({size_desc} size: {self._format_size(size)})"
        elif extension in ['.exe', '.dll', '.so']:
            return f"Executable/library file ({size_desc} size: {self._format_size(size)})"
        elif extension in ['.log', '.out']:
            return f"Log/output file ({size_desc} size: {self._format_size(size)})"
        
        # Name-based descriptions
        if 'readme' in file_name:
            return f"README documentation file ({size_desc} size: {self._format_size(size)})"
        elif 'license' in file_name:
            return f"License file ({size_desc} size: {self._format_size(size)})"
        elif 'changelog' in file_name:
            return f"Changelog file ({size_desc} size: {self._format_size(size)})"
        elif 'config' in file_name:
            return f"Configuration file ({size_desc} size: {self._format_size(size)})"
        elif 'test' in file_name:
            return f"Test file ({size_desc} size: {self._format_size(size)})"
        
        # Default description
        return f"File ({size_desc} size: {self._format_size(size)})"
    
    def _format_size(self, size: int) -> str:
        """Format file size in human-readable format."""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} PB"
    
    def _log_progress(self):
        """Log current progress statistics."""
        elapsed = datetime.now() - self.stats.start_time
        logging.info(f"Progress: {self.stats.processed_files:,} files, "
                    f"{self.stats.processed_folders:,} folders processed in {elapsed}")
    
    def generate_markdown_report(self) -> bool:
        """Generate comprehensive markdown report."""
        try:
            logging.info("Generating markdown report...")
            
            # Sort structure data by path for organized output
            self.structure_data.sort(key=lambda x: (x['path'], x['type']))
            
            with open(self.output_file, 'w', encoding='utf-8') as f:
                self._write_markdown_header(f)
                self._write_summary_statistics(f)
                self._write_directory_structure(f)
                self._write_detailed_listings(f)
                self._write_appendix(f)
            
            logging.info(f"Markdown report generated: {self.output_file}")
            return True
            
        except Exception as e:
            logging.error(f"Failed to generate markdown report: {e}")
            return False
    
    def _write_markdown_header(self, f):
        """Write markdown header section."""
        f.write("# Comprehensive Folder Mapping Report\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Source:** {self.zip_path}\n")
        f.write(f"**Processing Time:** {datetime.now() - self.stats.start_time}\n\n")
        f.write("---\n\n")
    
    def _write_summary_statistics(self, f):
        """Write summary statistics section."""
        f.write("## Summary Statistics\n\n")
        f.write(f"- **Total Files:** {self.stats.processed_files:,}\n")
        f.write(f"- **Total Folders:** {self.stats.processed_folders:,}\n")
        f.write(f"- **Total Size:** {self._format_size(self.stats.total_size)}\n")
        f.write(f"- **Large Files (>100MB):** {self.stats.large_files:,}\n")
        f.write(f"- **Empty Directories:** {self.stats.empty_directories:,}\n")
        f.write(f"- **Permission Denials:** {self.stats.permission_denials:,}\n")
        f.write(f"- **Processing Errors:** {self.stats.errors_encountered:,}\n\n")
        f.write("---\n\n")
    
    def _write_directory_structure(self, f):
        """Write directory structure tree."""
        f.write("## Directory Structure Tree\n\n")
        f.write("```\n")
        
        # Build tree structure
        directories = [item for item in self.structure_data if item['type'] == 'directory']
        directories.sort(key=lambda x: x['path'])
        
        for directory in directories:
            indent = "  " * directory['level']
            f.write(f"{indent}📁 {directory['name']}/\n")
        
        f.write("```\n\n")
        f.write("---\n\n")
    
    def _write_detailed_listings(self, f):
        """Write detailed file and folder listings."""
        f.write("## Detailed File and Folder Listings\n\n")
        
        # Group by directory level for better organization
        current_level = -1
        current_path = ""
        
        for item in self.structure_data:
            # Check if we're in a new directory
            item_dir = str(Path(item['path']).parent)
            if item_dir != current_path:
                current_path = item_dir
                if current_path != '.':
                    f.write(f"### Directory: `{current_path}`\n\n")
                else:
                    f.write(f"### Root Directory\n\n")
            
            # Write item details
            icon = "📁" if item['type'] == 'directory' else "📄"
            f.write(f"**{icon} {item['name']}**\n")
            f.write(f"- **Path:** `{item['path']}`\n")
            f.write(f"- **Type:** {item['type'].title()}\n")
            f.write(f"- **Description:** {item['description']}\n")
            
            if item['type'] == 'file':
                f.write(f"- **Size:** {item['size_human']}\n")
                if item.get('mime_type'):
                    f.write(f"- **MIME Type:** {item['mime_type']}\n")
                if item.get('extension'):
                    f.write(f"- **Extension:** {item['extension']}\n")
            elif item['type'] == 'directory':
                f.write(f"- **Items:** {item['item_count']}\n")
                f.write(f"- **Status:** {'Accessible' if item['is_accessible'] else 'Restricted'}\n")
            
            f.write("\n")
        
        f.write("---\n\n")
    
    def _write_appendix(self, f):
        """Write appendix with additional information."""
        f.write("## Appendix\n\n")
        f.write("### File Extensions Summary\n\n")
        
        # Collect extension statistics
        extensions = {}
        for item in self.structure_data:
            if item['type'] == 'file' and item.get('extension'):
                ext = item['extension']
                extensions[ext] = extensions.get(ext, 0) + 1
        
        # Sort by count
        sorted_extensions = sorted(extensions.items(), key=lambda x: x[1], reverse=True)
        
        for ext, count in sorted_extensions:
            f.write(f"- **{ext}:** {count:,} files\n")
        
        f.write("\n")
        f.write("### Processing Log\n\n")
        f.write("For detailed processing information, see the log file generated alongside this report.\n\n")
        f.write("---\n\n")
        f.write("*Report generated by Comprehensive Folder Mapper*\n")
    
    def cleanup(self):
        """Clean up temporary files and directories."""
        if self.temp_dir and os.path.exists(self.temp_dir):
            try:
                shutil.rmtree(self.temp_dir)
                logging.info(f"Cleaned up temporary directory: {self.temp_dir}")
            except Exception as e:
                logging.error(f"Failed to cleanup temporary directory: {e}")
    
    def execute(self) -> bool:
        """Execute the complete folder mapping process."""
        try:
            logging.info("Starting comprehensive folder mapping process...")
            
            # Step 1: Extract ZIP file
            if not self.extract_zip_comprehensive():
                return False
            
            # Step 2: Map directory structure
            if not self.map_directory_structure_comprehensive():
                return False
            
            # Step 3: Generate markdown report
            if not self.generate_markdown_report():
                return False
            
            # Step 4: Log final statistics
            elapsed = datetime.now() - self.stats.start_time
            logging.info(f"Process completed successfully in {elapsed}")
            logging.info(f"Results saved to: {self.output_file}")
            
            return True
            
        except Exception as e:
            logging.error(f"Process failed: {e}")
            return False
        finally:
            self.cleanup()


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(description="Comprehensive Folder Mapping Tool")
    parser.add_argument("zip_path", help="Path to the ZIP file to analyze")
    parser.add_argument("-o", "--output", default="folder_mapping.md", 
                       help="Output markdown file path")
    parser.add_argument("--max-depth", type=int, default=100,
                       help="Maximum directory depth to process")
    parser.add_argument("--max-workers", type=int, default=8,
                       help="Maximum number of worker threads")
    parser.add_argument("--chunk-size", type=int, default=5000,
                       help="Batch size for processing items")
    
    args = parser.parse_args()
    
    # Validate input file
    if not Path(args.zip_path).exists():
        print(f"Error: ZIP file not found: {args.zip_path}")
        return 1
    
    # Create mapper instance
    mapper = ComprehensiveFolderMapper(args.zip_path, args.output)
    mapper.max_depth = args.max_depth
    mapper.max_workers = args.max_workers
    mapper.chunk_size = args.chunk_size
    
    # Execute mapping process
    success = mapper.execute()
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
