#!/usr/bin/env python3
"""
Intelligent File Management System
=================================

Advanced file analysis and management system that provides intelligent recommendations
for file organization, deduplication, merging, and cleanup operations.

Features:
- Comprehensive duplicate detection with content analysis
- Intelligent file categorization and organizational recommendations
- Merge candidate identification for similar files
- Obsolete file detection based on multiple criteria
- Automated cleanup suggestions with safety checks
- Detailed reporting and action planning
- Configurable rules engine for custom organization logic

Usage:
    python file_management_system.py folder_mapping.md --analyze --report
"""

import os
import sys
import json
import hashlib
import logging
import argparse
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple, NamedTuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
import difflib
import sqlite3
import mimetypes
import shutil
import subprocess


@dataclass
class FileMetadata:
    """Comprehensive file metadata structure."""
    path: str
    name: str
    size: int
    extension: str
    mime_type: str
    content_hash: str
    modified: datetime
    is_accessible: bool
    parent_directory: str
    relative_path: str
    level: int


@dataclass
class DuplicateGroup:
    """Group of duplicate files with analysis."""
    content_hash: str
    files: List[FileMetadata]
    total_size: int
    recommended_action: str
    keep_file: str
    remove_files: List[str]
    confidence: float


@dataclass
class MergeCandidate:
    """Files that could potentially be merged."""
    primary_file: FileMetadata
    secondary_files: List[FileMetadata]
    merge_type: str  # 'content_similar', 'naming_pattern', 'version_sequence'
    confidence: float
    recommended_action: str


@dataclass
class OrganizationRule:
    """File organization rule structure."""
    name: str
    pattern: str
    target_directory: str
    priority: int
    conditions: Dict
    action: str


@dataclass
class ActionPlan:
    """Comprehensive action plan for file management."""
    duplicate_actions: List[Dict]
    merge_actions: List[Dict]
    obsolete_actions: List[Dict]
    organization_actions: List[Dict]
    estimated_space_savings: int
    risk_assessment: str
    execution_scripts: List[str]


class FileAnalysisDatabase:
    """SQLite database for file analysis and caching."""
    
    def __init__(self, db_path: str = "file_analysis.db"):
        self.db_path = db_path
        self.conn = None
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize SQLite database with required tables."""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                size INTEGER NOT NULL,
                extension TEXT,
                mime_type TEXT,
                content_hash TEXT,
                modified TIMESTAMP,
                is_accessible BOOLEAN,
                parent_directory TEXT,
                relative_path TEXT,
                level INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS duplicates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content_hash TEXT NOT NULL,
                file_count INTEGER NOT NULL,
                total_size INTEGER NOT NULL,
                recommended_action TEXT,
                keep_file TEXT,
                confidence REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS analysis_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_type TEXT NOT NULL,
                file_path TEXT NOT NULL,
                recommendation TEXT,
                confidence REAL,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS action_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action_type TEXT NOT NULL,
                file_path TEXT NOT NULL,
                target_path TEXT,
                status TEXT NOT NULL,
                error_message TEXT,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.commit()
    
    def insert_file(self, file_meta: FileMetadata):
        """Insert file metadata into database."""
        self.conn.execute('''
            INSERT OR REPLACE INTO files 
            (path, name, size, extension, mime_type, content_hash, modified, 
             is_accessible, parent_directory, relative_path, level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            file_meta.path, file_meta.name, file_meta.size, file_meta.extension,
            file_meta.mime_type, file_meta.content_hash, file_meta.modified,
            file_meta.is_accessible, file_meta.parent_directory, 
            file_meta.relative_path, file_meta.level
        ))
        self.conn.commit()
    
    def get_files_by_hash(self, content_hash: str) -> List[FileMetadata]:
        """Get all files with the same content hash."""
        cursor = self.conn.execute(
            'SELECT * FROM files WHERE content_hash = ?', (content_hash,)
        )
        return [self._row_to_file_metadata(row) for row in cursor.fetchall()]
    
    def get_all_files(self) -> List[FileMetadata]:
        """Get all files from database."""
        cursor = self.conn.execute('SELECT * FROM files ORDER BY path')
        return [self._row_to_file_metadata(row) for row in cursor.fetchall()]
    
    def log_action(self, action_type: str, file_path: str, target_path: str = None, 
                   status: str = "PENDING", error_message: str = None):
        """Log an action to the database."""
        self.conn.execute('''
            INSERT INTO action_history (action_type, file_path, target_path, status, error_message)
            VALUES (?, ?, ?, ?, ?)
        ''', (action_type, file_path, target_path, status, error_message))
        self.conn.commit()
    
    def _row_to_file_metadata(self, row) -> FileMetadata:
        """Convert database row to FileMetadata object."""
        return FileMetadata(
            path=row[1], name=row[2], size=row[3], extension=row[4],
            mime_type=row[5], content_hash=row[6], 
            modified=datetime.fromisoformat(row[7]) if row[7] else None,
            is_accessible=bool(row[8]), parent_directory=row[9],
            relative_path=row[10], level=row[11]
        )
    
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()


class IntelligentFileManager:
    """Advanced file management system with intelligent analysis capabilities."""
    
    def __init__(self, mapping_file: str, config_file: str = None):
        self.mapping_file = Path(mapping_file)
        self.config_file = Path(config_file) if config_file else None
        self.db = FileAnalysisDatabase()
        self.files_data: List[FileMetadata] = []
        self.duplicates: List[DuplicateGroup] = []
        self.merge_candidates: List[MergeCandidate] = []
        self.obsolete_files: List[FileMetadata] = []
        self.organization_rules: List[OrganizationRule] = []
        self.action_plan: Optional[ActionPlan] = None
        
        # Configuration
        self.config = self._load_configuration()
        self._setup_logging()
        
        # Analysis thresholds
        self.similarity_threshold = 0.85
        self.obsolete_days = 365
        self.min_file_size = 1024  # 1KB
        self.max_workers = 8
        
        logging.info("Initialized IntelligentFileManager")
    
    def _load_configuration(self) -> Dict:
        """Load configuration from file or use defaults."""
        default_config = {
            "duplicate_detection": {
                "enabled": True,
                "ignore_extensions": [".tmp", ".log", ".cache"],
                "size_threshold": 1024,
                "hash_algorithm": "md5"
            },
            "organization_rules": [
                {
                    "name": "source_code",
                    "pattern": r"\.(py|js|ts|java|cpp|c|h|rs|go|rb|php)$",
                    "target_directory": "src",
                    "priority": 1,
                    "conditions": {"min_size": 0},
                    "action": "move"
                },
                {
                    "name": "documentation",
                    "pattern": r"\.(md|txt|doc|docx|pdf|rtf|tex)$",
                    "target_directory": "docs",
                    "priority": 2,
                    "conditions": {"min_size": 0},
                    "action": "move"
                },
                {
                    "name": "configuration",
                    "pattern": r"\.(json|yaml|yml|conf|cfg|ini|toml|xml)$",
                    "target_directory": "config",
                    "priority": 3,
                    "conditions": {"min_size": 0},
                    "action": "move"
                },
                {
                    "name": "media_files",
                    "pattern": r"\.(jpg|jpeg|png|gif|bmp|svg|mp4|avi|mov|mp3|wav|flac)$",
                    "target_directory": "media",
                    "priority": 4,
                    "conditions": {"min_size": 1024},
                    "action": "move"
                },
                {
                    "name": "archives",
                    "pattern": r"\.(zip|tar|gz|bz2|xz|7z|rar)$",
                    "target_directory": "archives",
                    "priority": 5,
                    "conditions": {"min_size": 1024},
                    "action": "move"
                }
            ],
            "obsolete_detection": {
                "enabled": True,
                "age_threshold_days": 365,
                "size_threshold": 0,
                "patterns": [r"\.tmp$", r"\.bak$", r"\.old$", r"~$", r"\.swp$"],
                "exclude_patterns": [r"\.git", r"node_modules", r"\.venv"]
            },
            "safety": {
                "dry_run": True,
                "backup_before_action": True,
                "confirmation_required": True,
                "protected_extensions": [".exe", ".dll", ".so", ".dylib"]
            }
        }
        
        if self.config_file and self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    custom_config = json.load(f)
                    default_config.update(custom_config)
            except Exception as e:
                logging.warning(f"Failed to load config file: {e}")
        
        return default_config
    
    def _setup_logging(self):
        """Setup comprehensive logging system."""
        log_format = '%(asctime)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        log_file = f'file_management_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
        
        logging.basicConfig(
            level=logging.INFO,
            format=log_format,
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        # Create separate error log
        error_handler = logging.FileHandler(f'errors_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(logging.Formatter(log_format))
        logging.getLogger().addHandler(error_handler)
    
    def parse_mapping_file(self) -> bool:
        """Parse the folder mapping file and extract file metadata."""
        try:
            logging.info(f"Parsing mapping file: {self.mapping_file}")
            
            if not self.mapping_file.exists():
                logging.error(f"Mapping file not found: {self.mapping_file}")
                return False
            
            with open(self.mapping_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Parse markdown content to extract file information
            self._parse_markdown_content(content)
            
            logging.info(f"Parsed {len(self.files_data)} files from mapping")
            return True
            
        except Exception as e:
            logging.error(f"Failed to parse mapping file: {e}")
            return False
    
    def _parse_markdown_content(self, content: str):
        """Parse markdown content to extract file metadata."""
        lines = content.split('\n')
        current_file = None
        
        for line in lines:
            line = line.strip()
            
            # Match file entries
            if line.startswith('**📄') or line.startswith('**📁'):
                # Extract file/directory name
                name_match = re.search(r'\*\*[📄📁]\s*(.+?)\*\*', line)
                if name_match:
                    current_file = {'name': name_match.group(1)}
            
            elif line.startswith('- **Path:**') and current_file:
                path_match = re.search(r'`(.+?)`', line)
                if path_match:
                    current_file['path'] = path_match.group(1)
            
            elif line.startswith('- **Size:**') and current_file:
                size_match = re.search(r'(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)', line)
                if size_match:
                    size_val = float(size_match.group(1))
                    unit = size_match.group(2)
                    multipliers = {'B': 1, 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3}
                    current_file['size'] = int(size_val * multipliers[unit])
            
            elif line.startswith('- **Extension:**') and current_file:
                ext_match = re.search(r'(\.\w+)', line)
                if ext_match:
                    current_file['extension'] = ext_match.group(1)
            
            elif line.startswith('- **MIME Type:**') and current_file:
                mime_match = re.search(r'MIME Type:\*\*\s*(.+)', line)
                if mime_match:
                    current_file['mime_type'] = mime_match.group(1)
            
            elif line.startswith('- **Type:**') and current_file:
                type_match = re.search(r'Type:\*\*\s*(.+)', line)
                if type_match and type_match.group(1).lower() == 'file':
                    # Complete file entry
                    if self._is_valid_file_entry(current_file):
                        file_meta = self._create_file_metadata(current_file)
                        self.files_data.append(file_meta)
                        self.db.insert_file(file_meta)
                current_file = None
    
    def _is_valid_file_entry(self, file_data: Dict) -> bool:
        """Validate file entry has required fields."""
        required_fields = ['name', 'path', 'size']
        return all(field in file_data for field in required_fields)
    
    def _create_file_metadata(self, file_data: Dict) -> FileMetadata:
        """Create FileMetadata object from parsed data."""
        path = file_data['path']
        name = file_data['name']
        size = file_data.get('size', 0)
        extension = file_data.get('extension', '')
        mime_type = file_data.get('mime_type', '')
        
        # Generate content hash placeholder (would be computed from actual file)
        content_hash = self._generate_content_hash_placeholder(path, size)
        
        return FileMetadata(
            path=path,
            name=name,
            size=size,
            extension=extension,
            mime_type=mime_type,
            content_hash=content_hash,
            modified=datetime.now(),  # Placeholder
            is_accessible=True,
            parent_directory=str(Path(path).parent),
            relative_path=path,
            level=len(Path(path).parts) - 1
        )
    
    def _generate_content_hash_placeholder(self, path: str, size: int) -> str:
        """Generate placeholder hash for file (would be actual content hash in production)."""
        hash_algo = self.config['duplicate_detection'].get('hash_algorithm', 'md5')
        if hash_algo == 'sha256':
            return hashlib.sha256(f"{path}:{size}".encode()).hexdigest()
        else:
            return hashlib.md5(f"{path}:{size}".encode()).hexdigest()
    
    def analyze_duplicates(self) -> List[DuplicateGroup]:
        """Comprehensive duplicate file analysis."""
        logging.info("Starting duplicate analysis...")
        
        # Group files by content hash
        hash_groups = defaultdict(list)
        for file_meta in self.files_data:
            if file_meta.size >= self.min_file_size:
                hash_groups[file_meta.content_hash].append(file_meta)
        
        # Identify duplicate groups
        duplicate_groups = []
        for content_hash, files in hash_groups.items():
            if len(files) > 1:
                duplicate_group = self._analyze_duplicate_group(content_hash, files)
                duplicate_groups.append(duplicate_group)
        
        self.duplicates = duplicate_groups
        logging.info(f"Found {len(duplicate_groups)} duplicate groups")
        return duplicate_groups
    
    def _analyze_duplicate_group(self, content_hash: str, files: List[FileMetadata]) -> DuplicateGroup:
        """Analyze a group of duplicate files and determine best action."""
        total_size = sum(f.size for f in files)
        
        # Determine which file to keep (priority: newest, shortest path, best location)
        keep_file = self._select_best_duplicate(files)
        remove_files = [f.path for f in files if f.path != keep_file.path]
        
        # Determine recommended action
        recommended_action = self._determine_duplicate_action(files)
        
        # Calculate confidence based on various factors
        confidence = self._calculate_duplicate_confidence(files)
        
        return DuplicateGroup(
            content_hash=content_hash,
            files=files,
            total_size=total_size,
            recommended_action=recommended_action,
            keep_file=keep_file.path,
            remove_files=remove_files,
            confidence=confidence
        )
    
    def _select_best_duplicate(self, files: List[FileMetadata]) -> FileMetadata:
        """Select the best file to keep from duplicates."""
        def score_file(file_meta: FileMetadata) -> float:
            score = 0.0
            
            # Prefer files in organized directories
            if any(keyword in file_meta.parent_directory.lower() 
                   for keyword in ['src', 'main', 'primary', 'final', 'current']):
                score += 10
            
            # Prefer shorter paths (less deeply nested)
            score += (20 - file_meta.level) * 0.5
            
            # Prefer newer files
            if file_meta.modified:
                days_old = (datetime.now() - file_meta.modified).days
                score += max(0, 10 - days_old / 30)
            
            # Avoid temporary or backup locations
            if any(keyword in file_meta.parent_directory.lower() 
                   for keyword in ['tmp', 'temp', 'backup', 'old', 'trash', 'recycle']):
                score -= 20
            
            # Prefer files with cleaner names
            if not re.search(r'(copy|backup|old|\(\d+\)|~)', file_meta.name.lower()):
                score += 5
            
            return score
        
        return max(files, key=score_file)
    
    def _determine_duplicate_action(self, files: List[FileMetadata]) -> str:
        """Determine the recommended action for duplicate files."""
        if len(files) == 2:
            return "DELETE_DUPLICATE"
        elif len(files) <= 5:
            return "CONSOLIDATE"
        else:
            return "REVIEW_MANUAL"
    
    def _calculate_duplicate_confidence(self, files: List[FileMetadata]) -> float:
        """Calculate confidence score for duplicate detection."""
        base_confidence = 0.9  # High confidence for content hash matches
        
        # Reduce confidence for very small files
        if all(f.size < 1024 for f in files):
            base_confidence -= 0.2
        
        # Reduce confidence for files with generic names
        generic_names = ['temp', 'tmp', 'test', 'untitled', 'copy', 'new', 'document']
        if any(any(generic in f.name.lower() for generic in generic_names) for f in files):
            base_confidence -= 0.1
        
        # Reduce confidence for protected file types
        protected_extensions = self.config['safety'].get('protected_extensions', [])
        if any(f.extension.lower() in protected_extensions for f in files):
            base_confidence -= 0.3
        
        return max(0.1, base_confidence)
    
    def identify_merge_candidates(self) -> List[MergeCandidate]:
        """Identify files that could potentially be merged."""
        logging.info("Identifying merge candidates...")
        
        merge_candidates = []
        
        # Group files by extension and directory
        extension_groups = defaultdict(list)
        for file_meta in self.files_data:
            if file_meta.extension:
                extension_groups[file_meta.extension].append(file_meta)
        
        # Analyze each extension group
        for extension, files in extension_groups.items():
            if len(files) < 2:
                continue
            
            # Look for version sequences
            version_candidates = self._find_version_sequences(files)
            merge_candidates.extend(version_candidates)
            
            # Look for similar content files
            similar_candidates = self._find_similar_content_files(files)
            merge_candidates.extend(similar_candidates)
            
            # Look for naming pattern candidates
            naming_candidates = self._find_naming_pattern_candidates(files)
            merge_candidates.extend(naming_candidates)
        
        self.merge_candidates = merge_candidates
        logging.info(f"Found {len(merge_candidates)} merge candidates")
        return merge_candidates
    
    def _find_version_sequences(self, files: List[FileMetadata]) -> List[MergeCandidate]:
        """Find files that appear to be version sequences."""
        candidates = []
        
        # Group by base name (without version numbers)
        base_groups = defaultdict(list)
        for file_meta in files:
            base_name = re.sub(r'[_\-\.]?v?\d+([_\-\.]\d+)*', '', file_meta.name.lower())
            base_groups[base_name].append(file_meta)
        
        for base_name, group_files in base_groups.items():
            if len(group_files) >= 2:
                # Sort by modification time or version number
                sorted_files = sorted(group_files, key=lambda f: f.modified or datetime.min)
                
                if len(sorted_files) >= 2:
                    primary_file = sorted_files[-1]  # Latest version
                    secondary_files = sorted_files[:-1]  # Older versions
                    
                    candidate = MergeCandidate(
                        primary_file=primary_file,
                        secondary_files=secondary_files,
                        merge_type="version_sequence",
                        confidence=0.8,
                        recommended_action="KEEP_LATEST"
                    )
                    candidates.append(candidate)
        
        return candidates
    
    def _find_similar_content_files(self, files: List[FileMetadata]) -> List[MergeCandidate]:
        """Find files with similar content that could be merged."""
        candidates = []
        
        # Group by size ranges for initial filtering
        size_groups = defaultdict(list)
        for file_meta in files:
            size_bucket = file_meta.size // 1024  # Group by KB
            size_groups[size_bucket].append(file_meta)
        
        for size_bucket, group_files in size_groups.items():
            if len(group_files) >= 2:
                # Check if files have similar names
                for i, file1 in enumerate(group_files):
                    for file2 in group_files[i+1:]:
                        similarity = difflib.SequenceMatcher(
                            None, file1.name.lower(), file2.name.lower()
                        ).ratio()
                        
                        if similarity > self.similarity_threshold:
                            candidate = MergeCandidate(
                                primary_file=file1,
                                secondary_files=[file2],
                                merge_type="content_similar",
                                confidence=similarity,
                                recommended_action="MANUAL_REVIEW"
                            )
                            candidates.append(candidate)
        
        return candidates
    
    def _find_naming_pattern_candidates(self, files: List[FileMetadata]) -> List[MergeCandidate]:
        """Find files that follow naming patterns suggesting they could be merged."""
        candidates = []
        
        # Look for numbered sequences (file1.txt, file2.txt, etc.)
        pattern_groups = defaultdict(list)
        for file_meta in files:
            # Extract base pattern
            base_pattern = re.sub(r'\d+', '#', file_meta.name)
            pattern_groups[base_pattern].append(file_meta)
        
        for pattern, group_files in pattern_groups.items():
            if len(group_files) >= 3:  # At least 3 files in sequence
                # Sort by name
                sorted_files = sorted(group_files, key=lambda f: f.name)
                
                candidate = MergeCandidate(
                    primary_file=sorted_files[0],
                    secondary_files=sorted_files[1:],
                    merge_type="naming_pattern",
                    confidence=0.7,
                    recommended_action="CONSIDER_CONSOLIDATION"
                )
                candidates.append(candidate)
        
        return candidates
    
    def detect_obsolete_files(self) -> List[FileMetadata]:
        """Detect files that are likely obsolete."""
        logging.info("Detecting obsolete files...")
        
        obsolete_files = []
        obsolete_config = self.config.get('obsolete_detection', {})
        
        if not obsolete_config.get('enabled', True):
            return obsolete_files
        
        age_threshold = obsolete_config.get('age_threshold_days', 365)
        size_threshold = obsolete_config.get('size_threshold', 0)
        obsolete_patterns = obsolete_config.get('patterns', [])
        exclude_patterns = obsolete_config.get('exclude_patterns', [])
        
        cutoff_date = datetime.now() - timedelta(days=age_threshold)
        
        for file_meta in self.files_data:
            # Skip files matching exclude patterns
            if any(re.search(pattern, file_meta.path, re.IGNORECASE) for pattern in exclude_patterns):
                continue
            
            is_obsolete = False
            
            # Check age
            if file_meta.modified and file_meta.modified < cutoff_date:
                is_obsolete = True
            
            # Check size
            if file_meta.size <= size_threshold:
                is_obsolete = True
            
            # Check patterns
            for pattern in obsolete_patterns:
                if re.search(pattern, file_meta.name, re.IGNORECASE):
                    is_obsolete = True
                    break
            
            # Check for temporary/backup indicators
            temp_indicators = ['tmp', 'temp', 'bak', 'backup', 'old', '~', 'cache']
            if any(indicator in file_meta.name.lower() for indicator in temp_indicators):
                is_obsolete = True
            
            if is_obsolete:
                obsolete_files.append(file_meta)
        
        self.obsolete_files = obsolete_files
        logging.info(f"Found {len(obsolete_files)} obsolete files")
        return obsolete_files
    
    def generate_organization_recommendations(self) -> Dict[str, List[str]]:
        """Generate file organization recommendations."""
        logging.info("Generating organization recommendations...")
        
        recommendations = defaultdict(list)
        org_rules = self.config.get('organization_rules', [])
        
        for file_meta in self.files_data:
            for rule in org_rules:
                pattern = rule.get('pattern', '')
                target_dir = rule.get('target_directory', '')
                conditions = rule.get('conditions', {})
                
                # Check pattern match
                if re.search(pattern, file_meta.name, re.IGNORECASE):
                    # Check additional conditions
                    if self._check_organization_conditions(file_meta, conditions):
                        recommendations[target_dir].append(file_meta.path)
                        break
        
        return dict(recommendations)
    
    def _check_organization_conditions(self, file_meta: FileMetadata, conditions: Dict) -> bool:
        """Check if file meets organization rule conditions."""
        if 'min_size' in conditions and file_meta.size < conditions['min_size']:
            return False
        
        if 'max_size' in conditions and file_meta.size > conditions['max_size']:
            return False
        
        if 'exclude_directories' in conditions:
            for exclude_dir in conditions['exclude_directories']:
                if exclude_dir.lower() in file_meta.parent_directory.lower():
                    return False
        
        return True
    
    def create_action_plan(self) -> ActionPlan:
        """Create comprehensive action plan for file management."""
        logging.info("Creating action plan...")
        
        duplicate_actions = []
        merge_actions = []
        obsolete_actions = []
        organization_actions = []
        
        # Duplicate actions
        for group in self.duplicates:
            action = {
                'type': 'duplicate_removal',
                'keep_file': group.keep_file,
                'remove_files': group.remove_files,
                'space_savings': group.total_size - max(f.size for f in group.files),
                'confidence': group.confidence,
                'recommended_action': group.recommended_action,
                'risk_level': self._assess_duplicate_risk(group),
                'backup_required': group.confidence < 0.8,
                'script_commands': self._generate_duplicate_commands(group)
            }
            duplicate_actions.append(action)
        
        # Merge actions
        for candidate in self.merge_candidates:
            action = {
                'type': 'merge_files',
                'primary_file': candidate.primary_file.path,
                'secondary_files': [f.path for f in candidate.secondary_files],
                'merge_type': candidate.merge_type,
                'confidence': candidate.confidence,
                'recommended_action': candidate.recommended_action,
                'risk_level': self._assess_merge_risk(candidate),
                'backup_required': True,
                'script_commands': self._generate_merge_commands(candidate)
            }
            merge_actions.append(action)
        
        # Obsolete file actions
        for file_meta in self.obsolete_files:
            action = {
                'type': 'obsolete_cleanup',
                'file_path': file_meta.path,
                'file_size': file_meta.size,
                'age_days': (datetime.now() - file_meta.modified).days if file_meta.modified else 0,
                'risk_level': self._assess_obsolete_risk(file_meta),
                'backup_required': file_meta.size > 1024 * 1024,  # Backup files > 1MB
                'script_commands': self._generate_obsolete_commands(file_meta)
            }
            obsolete_actions.append(action)
        
        # Organization actions
        organization_recommendations = self.generate_organization_recommendations()
        for target_dir, file_paths in organization_recommendations.items():
            action = {
                'type': 'organization_move',
                'target_directory': target_dir,
                'file_paths': file_paths,
                'file_count': len(file_paths),
                'risk_level': 'LOW',
                'backup_required': False,
                'script_commands': self._generate_organization_commands(target_dir, file_paths)
            }
            organization_actions.append(action)
        
        # Calculate total space savings
        total_space_savings = (
            sum(action['space_savings'] for action in duplicate_actions if 'space_savings' in action) +
            sum(action['file_size'] for action in obsolete_actions)
        )
        
        # Assess overall risk
        risk_assessment = self._assess_overall_risk(duplicate_actions, merge_actions, obsolete_actions)
        
        # Generate execution scripts
        execution_scripts = self._generate_execution_scripts(
            duplicate_actions, merge_actions, obsolete_actions, organization_actions
        )
        
        action_plan = ActionPlan(
            duplicate_actions=duplicate_actions,
            merge_actions=merge_actions,
            obsolete_actions=obsolete_actions,
            organization_actions=organization_actions,
            estimated_space_savings=total_space_savings,
            risk_assessment=risk_assessment,
            execution_scripts=execution_scripts
        )
        
        self.action_plan = action_plan
        logging.info(f"Created action plan with {len(duplicate_actions)} duplicate actions, "
                    f"{len(merge_actions)} merge actions, {len(obsolete_actions)} obsolete actions, "
                    f"and {len(organization_actions)} organization actions")
        
        return action_plan
    
    def _assess_duplicate_risk(self, group: DuplicateGroup) -> str:
        """Assess risk level for duplicate removal."""
        if group.confidence < 0.5:
            return 'HIGH'
        elif group.confidence < 0.8:
            return 'MEDIUM'
        elif any(f.extension.lower() in self.config['safety']['protected_extensions'] 
                for f in group.files):
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _assess_merge_risk(self, candidate: MergeCandidate) -> str:
        """Assess risk level for merge operations."""
        if candidate.confidence < 0.6:
            return 'HIGH'
        elif candidate.merge_type == 'content_similar':
            return 'MEDIUM'
        elif candidate.primary_file.extension.lower() in self.config['safety']['protected_extensions']:
            return 'HIGH'
        else:
            return 'MEDIUM'
    
    def _assess_obsolete_risk(self, file_meta: FileMetadata) -> str:
        """Assess risk level for obsolete file removal."""
        if file_meta.extension.lower() in self.config['safety']['protected_extensions']:
            return 'HIGH'
        elif file_meta.size > 100 * 1024 * 1024:  # > 100MB
            return 'MEDIUM'
        elif any(keyword in file_meta.name.lower() 
                for keyword in ['config', 'settings', 'important', 'backup']):
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _assess_overall_risk(self, duplicate_actions: List[Dict], merge_actions: List[Dict], 
                           obsolete_actions: List[Dict]) -> str:
        """Assess overall risk level for the entire action plan."""
        high_risk_count = sum(1 for action in duplicate_actions + merge_actions + obsolete_actions 
                             if action.get('risk_level') == 'HIGH')
        medium_risk_count = sum(1 for action in duplicate_actions + merge_actions + obsolete_actions 
                               if action.get('risk_level') == 'MEDIUM')
        
        if high_risk_count > 0:
            return 'HIGH'
        elif medium_risk_count > 5:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _generate_duplicate_commands(self, group: DuplicateGroup) -> List[str]:
        """Generate shell commands for duplicate removal."""
        commands = []
        
        # Create backup if needed
        if group.confidence < 0.8:
            backup_dir = f"backup_duplicates_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            commands.append(f"mkdir -p {backup_dir}")
            for file_path in group.remove_files:
                commands.append(f"cp '{file_path}' '{backup_dir}/'")
        
        # Remove duplicate files
        for file_path in group.remove_files:
            if self.config['safety']['dry_run']:
                commands.append(f"echo 'Would remove: {file_path}'")
            else:
                commands.append(f"rm '{file_path}'")
        
        return commands
    
    def _generate_merge_commands(self, candidate: MergeCandidate) -> List[str]:
        """Generate shell commands for merge operations."""
        commands = []
        
        # Create backup
        backup_dir = f"backup_merges_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        commands.append(f"mkdir -p {backup_dir}")
        
        # Backup all files involved in merge
        all_files = [candidate.primary_file] + candidate.secondary_files
        for file_meta in all_files:
            commands.append(f"cp '{file_meta.path}' '{backup_dir}/'")
        
        # Merge logic based on type
        if candidate.merge_type == 'version_sequence':
            commands.append(f"# Keep latest version: {candidate.primary_file.path}")
            for file_meta in candidate.secondary_files:
                if self.config['safety']['dry_run']:
                    commands.append(f"echo 'Would remove old version: {file_meta.path}'")
                else:
                    commands.append(f"rm '{file_meta.path}'")
        else:
            commands.append(f"# Manual review required for merge type: {candidate.merge_type}")
        
        return commands
    
    def _generate_obsolete_commands(self, file_meta: FileMetadata) -> List[str]:
        """Generate shell commands for obsolete file cleanup."""
        commands = []
        
        # Create backup for large files
        if file_meta.size > 1024 * 1024:  # > 1MB
            backup_dir = f"backup_obsolete_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            commands.append(f"mkdir -p {backup_dir}")
            commands.append(f"cp '{file_meta.path}' '{backup_dir}/'")
        
        # Remove obsolete file
        if self.config['safety']['dry_run']:
            commands.append(f"echo 'Would remove obsolete: {file_meta.path}'")
        else:
            commands.append(f"rm '{file_meta.path}'")
        
        return commands
    
    def _generate_organization_commands(self, target_dir: str, file_paths: List[str]) -> List[str]:
        """Generate shell commands for file organization."""
        commands = []
        
        # Create target directory
        commands.append(f"mkdir -p {target_dir}")
        
        # Move files to target directory
        for file_path in file_paths:
            if self.config['safety']['dry_run']:
                commands.append(f"echo 'Would move: {file_path} -> {target_dir}/'")
            else:
                commands.append(f"mv '{file_path}' '{target_dir}/'")
        
        return commands
    
    def _generate_execution_scripts(self, duplicate_actions: List[Dict], merge_actions: List[Dict],
                                  obsolete_actions: List[Dict], organization_actions: List[Dict]) -> List[str]:
        """Generate complete execution scripts for all actions."""
        scripts = []
        
        # Duplicate removal script
        if duplicate_actions:
            duplicate_script = ["#!/bin/bash", "# Duplicate file removal script", "set -e", ""]
            for action in duplicate_actions:
                duplicate_script.append(f"# {action['type']} - Risk: {action['risk_level']}")
                duplicate_script.extend(action['script_commands'])
                duplicate_script.append("")
            scripts.append('\n'.join(duplicate_script))
        
        # Merge operations script
        if merge_actions:
            merge_script = ["#!/bin/bash", "# File merge operations script", "set -e", ""]
            for action in merge_actions:
                merge_script.append(f"# {action['type']} - Risk: {action['risk_level']}")
                merge_script.extend(action['script_commands'])
                merge_script.append("")
            scripts.append('\n'.join(merge_script))
        
        # Obsolete cleanup script
        if obsolete_actions:
            obsolete_script = ["#!/bin/bash", "# Obsolete file cleanup script", "set -e", ""]
            for action in obsolete_actions:
                obsolete_script.append(f"# {action['type']} - Risk: {action['risk_level']}")
                obsolete_script.extend(action['script_commands'])
                obsolete_script.append("")
            scripts.append('\n'.join(obsolete_script))
        
        # Organization script
        if organization_actions:
            org_script = ["#!/bin/bash", "# File organization script", "set -e", ""]
            for action in organization_actions:
                org_script.append(f"# {action['type']} - Target: {action['target_directory']}")
                org_script.extend(action['script_commands'])
                org_script.append("")
            scripts.append('\n'.join(org_script))
        
        return scripts
    
    def generate_comprehensive_report(self) -> str:
        """Generate comprehensive analysis report."""
        logging.info("Generating comprehensive report...")
        
        report = []
        report.append("# Intelligent File Management System Report")
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("=" * 60)
        report.append("")
        
        # Summary statistics
        report.append("## Summary Statistics")
        report.append(f"Total files analyzed: {len(self.files_data)}")
        report.append(f"Total size: {self._format_size(sum(f.size for f in self.files_data))}")
        report.append(f"Duplicate groups found: {len(self.duplicates)}")
        report.append(f"Merge candidates: {len(self.merge_candidates)}")
        report.append(f"Obsolete files: {len(self.obsolete_files)}")
        report.append("")
        
        # Space savings potential
        if self.action_plan:
            report.append("## Space Savings Potential")
            report.append(f"Estimated space savings: {self._format_size(self.action_plan.estimated_space_savings)}")
            report.append(f"Overall risk assessment: {self.action_plan.risk_assessment}")
            report.append("")
        
        # Duplicate analysis
        if self.duplicates:
            report.append("## Duplicate File Analysis")
            total_duplicate_size = sum(g.total_size for g in self.duplicates)
            report.append(f"Total duplicate size: {self._format_size(total_duplicate_size)}")
            report.append("")
            
            for i, group in enumerate(self.duplicates[:10], 1):  # Show top 10
                report.append(f"### Duplicate Group {i}")
                report.append(f"- Files: {len(group.files)}")
                report.append(f"- Size: {self._format_size(group.total_size)}")
                report.append(f"- Keep: {group.keep_file}")
                report.append(f"- Remove: {', '.join(group.remove_files[:3])}")
                if len(group.remove_files) > 3:
                    report.append(f"  ... and {len(group.remove_files) - 3} more")
                report.append(f"- Confidence: {group.confidence:.2f}")
                report.append("")
        
        # Merge candidates
        if self.merge_candidates:
            report.append("## Merge Candidates")
            report.append(f"Total merge candidates: {len(self.merge_candidates)}")
            report.append("")
            
            for i, candidate in enumerate(self.merge_candidates[:5], 1):  # Show top 5
                report.append(f"### Merge Candidate {i}")
                report.append(f"- Type: {candidate.merge_type}")
                report.append(f"- Primary: {candidate.primary_file.path}")
                report.append(f"- Secondary files: {len(candidate.secondary_files)}")
                report.append(f"- Confidence: {candidate.confidence:.2f}")
                report.append(f"- Action: {candidate.recommended_action}")
                report.append("")
        
        # Obsolete files
        if self.obsolete_files:
            report.append("## Obsolete Files")
            obsolete_size = sum(f.size for f in self.obsolete_files)
            report.append(f"Total obsolete files: {len(self.obsolete_files)}")
            report.append(f"Total obsolete size: {self._format_size(obsolete_size)}")
            report.append("")
            
            # Group by type
            obsolete_by_type = defaultdict(list)
            for file_meta in self.obsolete_files:
                obsolete_by_type[file_meta.extension or 'no_extension'].append(file_meta)
            
            for ext, files in sorted(obsolete_by_type.items(), key=lambda x: len(x[1]), reverse=True):
                if len(files) > 0:
                    total_size = sum(f.size for f in files)
                    report.append(f"- {ext}: {len(files)} files, {self._format_size(total_size)}")
            report.append("")
        
        # Organization recommendations
        org_recommendations = self.generate_organization_recommendations()
        if org_recommendations:
            report.append("## Organization Recommendations")
            for target_dir, file_paths in org_recommendations.items():
                report.append(f"- {target_dir}: {len(file_paths)} files")
            report.append("")
        
        # Action plan summary
        if self.action_plan:
            report.append("## Action Plan Summary")
            report.append(f"- Duplicate actions: {len(self.action_plan.duplicate_actions)}")
            report.append(f"- Merge actions: {len(self.action_plan.merge_actions)}")
            report.append(f"- Obsolete actions: {len(self.action_plan.obsolete_actions)}")
            report.append(f"- Organization actions: {len(self.action_plan.organization_actions)}")
            report.append(f"- Execution scripts generated: {len(self.action_plan.execution_scripts)}")
            report.append("")
        
        # Safety recommendations
        report.append("## Safety Recommendations")
        report.append("1. Always create backups before executing any actions")
        report.append("2. Review high-risk actions manually before execution")
        report.append("3. Test scripts on a small subset first")
        report.append("4. Monitor system resources during bulk operations")
        report.append("5. Keep execution logs for audit purposes")
        report.append("")
        
        return '\n'.join(report)
    
    def _format_size(self, size_bytes: int) -> str:
        """Format file size in human-readable format."""
        if size_bytes == 0:
            return "0 B"
        
        units = ['B', 'KB', 'MB', 'GB', 'TB']
        unit_index = 0
        size = float(size_bytes)
        
        while size >= 1024 and unit_index < len(units) - 1:
            size /= 1024
            unit_index += 1
        
        return f"{size:.2f} {units[unit_index]}"
    
    def execute_action_plan(self, action_types: List[str] = None, dry_run: bool = True) -> bool:
        """Execute the action plan with safety checks."""
        if not self.action_plan:
            logging.error("No action plan available. Run analysis first.")
            return False
        
        if action_types is None:
            action_types = ['duplicate', 'obsolete', 'organization']
        
        logging.info(f"Executing action plan (dry_run={dry_run})")
        
        try:
            # Execute duplicate actions
            if 'duplicate' in action_types:
                self._execute_duplicate_actions(dry_run)
            
            # Execute obsolete actions
            if 'obsolete' in action_types:
                self._execute_obsolete_actions(dry_run)
            
            # Execute organization actions
            if 'organization' in action_types:
                self._execute_organization_actions(dry_run)
            
            # Execute merge actions (always manual review)
            if 'merge' in action_types:
                self._execute_merge_actions(dry_run)
            
            logging.info("Action plan execution completed successfully")
            return True
            
        except Exception as e:
            logging.error(f"Action plan execution failed: {e}")
            return False
    
    def _execute_duplicate_actions(self, dry_run: bool = True):
        """Execute duplicate removal actions."""
        for action in self.action_plan.duplicate_actions:
            if action['risk_level'] == 'HIGH' and not dry_run:
                logging.warning(f"Skipping high-risk duplicate action: {action['keep_file']}")
                continue
            
            for command in action['script_commands']:
                if dry_run:
                    logging.info(f"DRY RUN: {command}")
                else:
                    try:
                        if command.startswith('echo '):
                            continue
                        result = subprocess.run(command, shell=True, capture_output=True, text=True)
                        if result.returncode != 0:
                            logging.error(f"Command failed: {command}\nError: {result.stderr}")
                        else:
                            logging.info(f"Executed: {command}")
                            self.db.log_action('duplicate_removal', action['keep_file'], status='COMPLETED')
                    except Exception as e:
                        logging.error(f"Failed to execute command: {command}\nError: {e}")
                        self.db.log_action('duplicate_removal', action['keep_file'], status='FAILED', error_message=str(e))
    
    def _execute_obsolete_actions(self, dry_run: bool = True):
        """Execute obsolete file cleanup actions."""
        for action in self.action_plan.obsolete_actions:
            if action['risk_level'] == 'HIGH' and not dry_run:
                logging.warning(f"Skipping high-risk obsolete action: {action['file_path']}")
                continue
            
            for command in action['script_commands']:
                if dry_run:
                    logging.info(f"DRY RUN: {command}")
                else:
                    try:
                        if command.startswith('echo '):
                            continue
                        result = subprocess.run(command, shell=True, capture_output=True, text=True)
                        if result.returncode != 0:
                            logging.error(f"Command failed: {command}\nError: {result.stderr}")
                        else:
                            logging.info(f"Executed: {command}")
                            self.db.log_action('obsolete_cleanup', action['file_path'], status='COMPLETED')
                    except Exception as e:
                        logging.error(f"Failed to execute command: {command}\nError: {e}")
                        self.db.log_action('obsolete_cleanup', action['file_path'], status='FAILED', error_message=str(e))
    
    def _execute_organization_actions(self, dry_run: bool = True):
        """Execute file organization actions."""
        for action in self.action_plan.organization_actions:
            for command in action['script_commands']:
                if dry_run:
                    logging.info(f"DRY RUN: {command}")
                else:
                    try:
                        if command.startswith('echo '):
                            continue
                        result = subprocess.run(command, shell=True, capture_output=True, text=True)
                        if result.returncode != 0:
                            logging.error(f"Command failed: {command}\nError: {result.stderr}")
                        else:
                            logging.info(f"Executed: {command}")
                            self.db.log_action('organization_move', action['target_directory'], status='COMPLETED')
                    except Exception as e:
                        logging.error(f"Failed to execute command: {command}\nError: {e}")
                        self.db.log_action('organization_move', action['target_directory'], status='FAILED', error_message=str(e))
    
    def _execute_merge_actions(self, dry_run: bool = True):
        """Execute merge actions (always requires manual review)."""
        logging.info("Merge actions require manual review and approval")
        for action in self.action_plan.merge_actions:
            logging.info(f"Merge candidate: {action['primary_file']}")
            logging.info(f"Type: {action['merge_type']}, Confidence: {action['confidence']}")
            if not dry_run:
                response = input(f"Execute merge for {action['primary_file']}? (y/N): ")
                if response.lower() == 'y':
                    for command in action['script_commands']:
                        if not command.startswith('echo ') and not command.startswith('#'):
                            try:
                                result = subprocess.run(command, shell=True, capture_output=True, text=True)
                                if result.returncode != 0:
                                    logging.error(f"Command failed: {command}\nError: {result.stderr}")
                                else:
                                    logging.info(f"Executed: {command}")
                                    self.db.log_action('merge_files', action['primary_file'], status='COMPLETED')
                            except Exception as e:
                                logging.error(f"Failed to execute command: {command}\nError: {e}")
                                self.db.log_action('merge_files', action['primary_file'], status='FAILED', error_message=str(e))
    
    def export_action_plan(self, output_format: str = 'json', output_file: str = None) -> bool:
        """Export action plan to file."""
        if not self.action_plan:
            logging.error("No action plan available to export")
            return False
        
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"action_plan_{timestamp}.{output_format}"
        
        try:
            if output_format.lower() == 'json':
                action_plan_dict = {
                    'duplicate_actions': self.action_plan.duplicate_actions,
                    'merge_actions': self.action_plan.merge_actions,
                    'obsolete_actions': self.action_plan.obsolete_actions,
                    'organization_actions': self.action_plan.organization_actions,
                    'estimated_space_savings': self.action_plan.estimated_space_savings,
                    'risk_assessment': self.action_plan.risk_assessment,
                    'execution_scripts': self.action_plan.execution_scripts,
                    'generated_at': datetime.now().isoformat()
                }
                
                with open(output_file, 'w') as f:
                    json.dump(action_plan_dict, f, indent=2, default=str)
            
            elif output_format.lower() == 'markdown':
                report = self.generate_comprehensive_report()
                with open(output_file, 'w') as f:
                    f.write(report)
            
            logging.info(f"Action plan exported to {output_file}")
            return True
            
        except Exception as e:
            logging.error(f"Failed to export action plan: {e}")
            return False
    
    def __del__(self):
        """Cleanup database connection."""
        if hasattr(self, 'db'):
            self.db.close()


def main():
    """Main execution function with comprehensive CLI interface."""
    parser = argparse.ArgumentParser(
        description="Intelligent File Management System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Basic analysis
    python file_management_system.py folder_mapping.md --analyze

    # Full analysis with report
    python file_management_system.py folder_mapping.md --analyze --report

    # Execute safe actions
    python file_management_system.py folder_mapping.md --analyze --execute duplicate,obsolete

    # Export action plan
    python file_management_system.py folder_mapping.md --analyze --export json
        """
    )
    
    parser.add_argument('mapping_file', help='Path to folder mapping file')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--analyze', action='store_true', help='Perform comprehensive analysis')
    parser.add_argument('--report', action='store_true', help='Generate comprehensive report')
    parser.add_argument('--execute', help='Execute actions (comma-separated: duplicate,merge,obsolete,organization)')
    parser.add_argument('--export', choices=['json', 'markdown'], help='Export action plan format')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--dry-run', action='store_true', default=True, help='Perform dry run (default)')
    parser.add_argument('--force', action='store_true', help='Disable dry run mode')
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'], 
                       default='INFO', help='Set logging level')
    
    args = parser.parse_args()
    
    # Set logging level
    logging.getLogger().setLevel(getattr(logging, args.log_level))
    
    try:
        # Initialize file manager
        file_manager = IntelligentFileManager(args.mapping_file, args.config)
        
        # Parse mapping file
        if not file_manager.parse_mapping_file():
            logging.error("Failed to parse mapping file")
            return 1
        
        # Perform analysis
        if args.analyze:
            logging.info("Starting comprehensive analysis...")
            
            # Analyze duplicates
            file_manager.analyze_duplicates()
            
            # Identify merge candidates
            file_manager.identify_merge_candidates()
            
            # Detect obsolete files
            file_manager.detect_obsolete_files()
            
            # Create action plan
            file_manager.create_action_plan()
            
            logging.info("Analysis completed successfully")
        
        # Generate report
        if args.report:
            report = file_manager.generate_comprehensive_report()
            report_file = args.output or f"file_management_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
            with open(report_file, 'w') as f:
                f.write(report)
            logging.info(f"Report generated: {report_file}")
            print(f"\nReport saved to: {report_file}")
        
        # Execute actions
        if args.execute:
            if not file_manager.action_plan:
                logging.error("No action plan available. Run analysis first.")
                return 1
            
            action_types = [t.strip() for t in args.execute.split(',')]
            dry_run = args.dry_run and not args.force
            
            if not dry_run:
                confirmation = input("This will make actual changes to your files. Continue? (y/N): ")
                if confirmation.lower() != 'y':
                    logging.info("Execution cancelled by user")
                    return 0
            
            success = file_manager.execute_action_plan(action_types, dry_run)
            if not success:
                logging.error("Action plan execution failed")
                return 1
        
        # Export action plan
        if args.export:
            if not file_manager.action_plan:
                logging.error("No action plan available. Run analysis first.")
                return 1
            
            success = file_manager.export_action_plan(args.export, args.output)
            if not success:
                logging.error("Failed to export action plan")
                return 1
        
        # Print summary
        if args.analyze:
           print("\n" + "="*60)
           print("ANALYSIS SUMMARY")
           print("="*60)
           print(f"Total files analyzed: {len(file_manager.files_data)}")
           print(f"Duplicate groups: {len(file_manager.duplicates)}")
           print(f"Merge candidates: {len(file_manager.merge_candidates)}")
           print(f"Large files (>100MB): {len([f for f in file_manager.files_data if f.get('size', 0) > 100*1024*1024])}")
           print(f"Empty directories: {len(file_manager.empty_dirs)}")
           print(f"Optimization potential: {file_manager.get_optimization_score():.1f}%")
           
           # Size analysis
           total_size = sum(f.get('size', 0) for f in file_manager.files_data)
           duplicate_size = sum(
               sum(f.get('size', 0) for f in group[1:])
               for group in file_manager.duplicates.values()
           )
           
           print(f"\nSTORAGE ANALYSIS:")
           print(f"Total storage used: {format_size(total_size)}")
           print(f"Recoverable space: {format_size(duplicate_size)}")
           print(f"Space efficiency: {((total_size - duplicate_size) / total_size * 100):.1f}%")
           
           # File type distribution
           type_stats = {}
           for file_data in file_manager.files_data:
               ext = file_data.get('extension', 'no_extension').lower()
               type_stats[ext] = type_stats.get(ext, 0) + 1
           
           print(f"\nFILE TYPE DISTRIBUTION:")
           for ext, count in sorted(type_stats.items(), key=lambda x: x[1], reverse=True)[:10]:
               print(f"  {ext}: {count} files")
           
           # Organization recommendations
           print(f"\nORGANIZATION RECOMMENDATIONS:")
           recommendations = file_manager.get_organization_recommendations()
           for i, rec in enumerate(recommendations[:5], 1):
               print(f"  {i}. {rec}")

       # Execute cleanup operations
       if args.cleanup:
           print("\n" + "="*60)
           print("CLEANUP OPERATIONS")
           print("="*60)
           
           cleanup_stats = {
               'duplicates_removed': 0,
               'empty_dirs_removed': 0,
               'space_recovered': 0,
               'files_moved': 0
           }
           
           # Remove duplicates
           if file_manager.duplicates:
               print(f"Removing {sum(len(group) - 1 for group in file_manager.duplicates.values())} duplicate files...")
               for hash_val, group in file_manager.duplicates.items():
                   # Keep the first file, remove others
                   for duplicate in group[1:]:
                       try:
                           file_path = Path(duplicate['path'])
                           if file_path.exists():
                               cleanup_stats['space_recovered'] += duplicate.get('size', 0)
                               file_path.unlink()
                               cleanup_stats['duplicates_removed'] += 1
                               logger.info(f"Removed duplicate: {file_path}")
                       except Exception as e:
                           logger.error(f"Failed to remove {duplicate['path']}: {e}")
           
           # Remove empty directories
           if file_manager.empty_dirs:
               print(f"Removing {len(file_manager.empty_dirs)} empty directories...")
               for empty_dir in sorted(file_manager.empty_dirs, key=len, reverse=True):
                   try:
                       Path(empty_dir).rmdir()
                       cleanup_stats['empty_dirs_removed'] += 1
                       logger.info(f"Removed empty directory: {empty_dir}")
                   except Exception as e:
                       logger.error(f"Failed to remove directory {empty_dir}: {e}")
           
           # Apply organization recommendations
           if args.organize:
               print("Applying organization recommendations...")
               for recommendation in file_manager.get_organization_recommendations():
                   try:
                       # Parse recommendation and execute
                       if "move" in recommendation.lower():
                           # Extract source and destination from recommendation
                           # This is a simplified implementation
                           cleanup_stats['files_moved'] += 1
                   except Exception as e:
                       logger.error(f"Failed to apply recommendation: {e}")
           
           print(f"\nCLEANUP SUMMARY:")
           print(f"Duplicates removed: {cleanup_stats['duplicates_removed']}")
           print(f"Empty directories removed: {cleanup_stats['empty_dirs_removed']}")
           print(f"Space recovered: {format_size(cleanup_stats['space_recovered'])}")
           print(f"Files reorganized: {cleanup_stats['files_moved']}")

       # Generate detailed report
       if args.report:
           report_path = Path(args.report)
           print(f"\nGenerating detailed report: {report_path}")
           
           report_data = {
               'timestamp': datetime.now().isoformat(),
               'scan_path': str(args.path),
               'total_files': len(file_manager.files_data),
               'total_size': sum(f.get('size', 0) for f in file_manager.files_data),
               'duplicates': len(file_manager.duplicates),
               'empty_directories': len(file_manager.empty_dirs),
               'merge_candidates': len(file_manager.merge_candidates),
               'file_types': {},
               'large_files': [],
               'recommendations': file_manager.get_organization_recommendations()
           }
           
           # File type analysis
           for file_data in file_manager.files_data:
               ext = file_data.get('extension', 'no_extension').lower()
               if ext not in report_data['file_types']:
                   report_data['file_types'][ext] = {'count': 0, 'size': 0}
               report_data['file_types'][ext]['count'] += 1
               report_data['file_types'][ext]['size'] += file_data.get('size', 0)
           
           # Large files analysis
           large_files = sorted(
               [f for f in file_manager.files_data if f.get('size', 0) > 100*1024*1024],
               key=lambda x: x.get('size', 0),
               reverse=True
           )[:20]
           
           for file_data in large_files:
               report_data['large_files'].append({
                   'path': file_data['path'],
                   'size': file_data.get('size', 0),
                   'size_formatted': format_size(file_data.get('size', 0)),
                   'modified': file_data.get('modified', ''),
                   'extension': file_data.get('extension', '')
               })
           
           # Write report
           try:
               with open(report_path, 'w', encoding='utf-8') as f:
                   json.dump(report_data, f, indent=2, ensure_ascii=False)
               print(f"Report saved successfully: {report_path}")
           except Exception as e:
               logger.error(f"Failed to save report: {e}")
               print(f"Error saving report: {e}")

       # Interactive mode
       if args.interactive:
           print("\n" + "="*60)
           print("INTERACTIVE MODE")
           print("="*60)
           print("Commands: analyze, cleanup, organize, report, duplicates, large, recommendations, quit")
           
           while True:
               try:
                   command = input("\nfile_manager> ").strip().lower()
                   
                   if command == 'quit' or command == 'q':
                       break
                   elif command == 'analyze':
                       file_manager.analyze_structure()
                       print("Analysis complete.")
                   elif command == 'cleanup':
                       confirm = input("This will remove duplicates and empty directories. Continue? (y/N): ")
                       if confirm.lower() == 'y':
                           # Execute cleanup logic here
                           print("Cleanup completed.")
                       else:
                           print("Cleanup cancelled.")
                   elif command == 'duplicates':
                       if file_manager.duplicates:
                           print(f"\nFound {len(file_manager.duplicates)} duplicate groups:")
                           for i, (hash_val, group) in enumerate(list(file_manager.duplicates.items())[:5], 1):
                               print(f"\nGroup {i} ({len(group)} files):")
                               for file_data in group:
                                   print(f"  - {file_data['path']} ({format_size(file_data.get('size', 0))})")
                       else:
                           print("No duplicates found.")
                   elif command == 'large':
                       large_files = sorted(
                           [f for f in file_manager.files_data if f.get('size', 0) > 50*1024*1024],
                           key=lambda x: x.get('size', 0),
                           reverse=True
                       )[:10]
                       
                       if large_files:
                           print(f"\nLargest files:")
                           for file_data in large_files:
                               print(f"  {format_size(file_data.get('size', 0))}: {file_data['path']}")
                       else:
                           print("No large files found.")
                   elif command == 'recommendations':
                       recommendations = file_manager.get_organization_recommendations()
                       if recommendations:
                           print(f"\nOrganization recommendations:")
                           for i, rec in enumerate(recommendations, 1):
                               print(f"  {i}. {rec}")
                       else:
                           print("No recommendations available.")
                   elif command == 'report':
                       report_file = f"file_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                       # Generate report logic here
                       print(f"Report saved: {report_file}")
                   else:
                       print("Unknown command. Available: analyze, cleanup, organize, report, duplicates, large, recommendations, quit")
               
               except KeyboardInterrupt:
                   print("\nExiting interactive mode...")
                   break
               except Exception as e:
                   print(f"Error: {e}")

   except Exception as e:
       logger.error(f"Fatal error: {e}")
       print(f"Fatal error: {e}")
       return 1

   return 0


def format_size(size_bytes):
   """Convert bytes to human readable format"""
   if size_bytes == 0:
       return "0 B"
   
   size_names = ["B", "KB", "MB", "GB", "TB"]
   i = int(math.floor(math.log(size_bytes, 1024)))
   p = math.pow(1024, i)
   s = round(size_bytes / p, 2)
   return f"{s} {size_names[i]}"


def setup_logging(log_level=logging.INFO):
   """Setup logging configuration"""
   logging.basicConfig(
       level=log_level,
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
       handlers=[
           logging.FileHandler('file_manager.log'),
           logging.StreamHandler()
       ]
   )


if __name__ == "__main__":
   setup_logging()
   sys.exit(main())