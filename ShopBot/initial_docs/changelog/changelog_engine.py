#!/usr/bin/env python3
"""
Automated Changelog Generation Engine
Enterprise-grade documentation with performance optimization
"""

import re
import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from state_manager_py import ChangeEvent, StateManager
from workspace_scanner import WorkspaceScanner

# Set up logging
logging.basicConfig(level=logging.ERROR)

@dataclass
class AnswerEntry:
    number: int
    timestamp: str
    action_type: str
    summary: str
    previous_state: str
    current_state: str
    changes_made: List[str]
    files_affected: List[Dict[str, str]]
    technical_decisions: List[str]
    next_actions: List[str]


class ChangelogEngine:
    def __init__(self, changelog_path: str = "Changelog.md"):
        self.changelog_path = Path(changelog_path)
        self.state_manager = StateManager()
        self.workspace_scanner = WorkspaceScanner()
        self.answer_counter = self._get_last_answer_number()

        # Action type classification
        self.action_types = {
            "architecture": ["system", "framework", "design", "structure"],
            "implementation": ["code", "script", "function", "class"],
            "modification": ["update", "change", "modify", "refactor"],
            "documentation": ["doc", "readme", "guide", "comment"],
            "configuration": ["config", "setting", "env", "ini"],
            "optimization": ["performance", "speed", "memory", "cache"],
            "integration": ["connect", "link", "merge", "combine"],
        }

    def _get_last_answer_number(self) -> int:
        """Extract last answer number from existing changelog"""
        if not self.changelog_path.exists():
            return 0

        try:
            content = self.changelog_path.read_text()
            matches = re.findall(r"### Answer #(\d+)", content)
            return max(int(match) for match in matches) if matches else 0
        except (IOError, ValueError):
            return 0

    def _classify_action_type(self, changes: List[ChangeEvent], summary: str) -> str:
        """Classify action type based on changes and summary"""
        summary_lower = summary.lower()

        # Count action indicators
        type_scores = {}
        for action_type, keywords in self.action_types.items():
            score = sum(1 for keyword in keywords if keyword in summary_lower)

            # Boost score based on file changes
            for event in changes:
                file_type = event.details.get("type", "")
                if action_type == "implementation" and file_type == "python":
                    score += 2
                elif action_type == "documentation" and file_type == "markdown":
                    score += 2
                elif action_type == "configuration" and file_type == "config":
                    score += 2

            type_scores[action_type] = score

        # Return highest scoring type
        best_type = max(type_scores.items(), key=lambda x: x[1])
        return best_type[0].title() if best_type[1] > 0 else "Implementation"

    def _generate_files_affected(
        self, changes: List[ChangeEvent]
    ) -> List[Dict[str, str]]:
        """Generate structured files affected list"""
        files_affected = []

        for event in changes:
            operation = event.change_type
            file_path = event.file_path

            # Determine operation type
            if operation == "ADDED":
                op_type = "NEW"
                description = f"Created {event.details.get('type', 'file')} with {event.details.get('size', 0)} bytes"
            elif operation == "REMOVED":
                op_type = "REMOVED"
                description = f"Deleted {event.details.get('type', 'file')}"
            else:  # MODIFIED
                op_type = "MODIFIED"
                size_change = event.details.get("size_change", 0)
                description = f"Updated content ({size_change:+d} bytes)"

            files_affected.append(
                {"operation": op_type, "file": file_path, "description": description}
            )

        # Sort by operation priority: NEW, MODIFIED, REMOVED
        priority = {"NEW": 1, "MODIFIED": 2, "REMOVED": 3}
        files_affected.sort(key=lambda x: (priority.get(x["operation"], 4), x["file"]))

        return files_affected

    def _extract_technical_decisions(
        self, changes: List[ChangeEvent], summary: str
    ) -> List[str]:
        """Extract technical decisions from changes"""
        decisions = []

        # Analyze high-impact changes
        high_impact_files = [e for e in changes if e.impact_level == "HIGH"]
        if high_impact_files:
            decisions.append(
                f"Critical system components modified: {len(high_impact_files)} files"
            )

        # Analyze file types affected
        file_types = set(e.details.get("type", "unknown") for e in changes)
        if len(file_types) > 1:
            decisions.append(
                f"Multi-technology approach: {', '.join(sorted(file_types))}"
            )

        # Performance considerations
        large_files = [e for e in changes if e.details.get("size", 0) > 10000]
        if large_files:
            decisions.append(
                f"Large file operations optimized: {len(large_files)} files"
            )

        # Default technical decision
        if not decisions:
            decisions.append(
                "Implementation follows established architectural patterns"
            )

        return decisions

    def _generate_next_actions(
        self, changes: List[ChangeEvent], action_type: str
    ) -> List[str]:
        """Generate next action items"""
        actions = []

        # Based on action type
        if action_type.lower() == "architecture":
            actions.extend(
                [
                    "Implement core system components",
                    "Establish integration protocols",
                    "Define performance benchmarks",
                ]
            )
        elif action_type.lower() == "implementation":
            actions.extend(
                [
                    "Execute comprehensive testing protocols",
                    "Validate system integration points",
                    "Monitor performance metrics",
                ]
            )
        elif action_type.lower() == "modification":
            actions.extend(
                [
                    "Verify system stability",
                    "Update dependent components",
                    "Document change impacts",
                ]
            )
        else:
            actions.extend(
                [
                    "Continue systematic development",
                    "Maintain architectural consistency",
                    "Execute validation protocols",
                ]
            )

        return actions[:3]  # Limit to 3 actions

    def generate_answer_entry(
        self,
        summary: str,
        previous_description: str = "",
        current_description: str = "",
    ) -> AnswerEntry:
        """Generate complete answer entry"""
        # Detect changes
        changes = self.state_manager.detect_changes()

        # Increment answer counter
        self.answer_counter += 1

        # Classify action type
        action_type = self._classify_action_type(changes, summary)

        # Generate change descriptions
        changes_made = []
        if changes:
            change_summary = self.state_manager.generate_change_summary(changes)
            changes_made.extend(
                [
                    f"Modified {change_summary['total_changes']} files across {len(change_summary['affected_types'])} technologies",
                    f"Impact distribution: {change_summary['by_impact']}",
                    f"Operation breakdown: {change_summary['by_type']}",
                ]
            )
        else:
            changes_made.append("System architecture and framework definition")

        return AnswerEntry(
            number=self.answer_counter,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
            action_type=action_type,
            summary=summary,
            previous_state=previous_description or "Development continuation state",
            current_state=current_description or "Enhanced system implementation",
            changes_made=changes_made,
            files_affected=self._generate_files_affected(changes),
            technical_decisions=self._extract_technical_decisions(changes, summary),
            next_actions=self._generate_next_actions(changes, action_type),
        )

    def format_answer_entry(self, entry: AnswerEntry) -> str:
        """Format answer entry as markdown"""
        lines = [
            f"### Answer #{entry.number:03d} - {entry.summary}",
            f"**Timestamp:** {entry.timestamp}",
            f"**Action Type:** {entry.action_type}",
            f"**Previous State:** {entry.previous_state}",
            f"**Current State:** {entry.current_state}",
            "",
            "#### Changes Made:",
        ]

        for change in entry.changes_made:
            lines.append(f"- {change}")

        lines.extend(["", "#### Files Affected:"])
        for file_info in entry.files_affected:
            lines.append(
                f"- **{file_info['operation']}:** {file_info['file']} - {file_info['description']}"
            )

        lines.extend(["", "#### Technical Decisions:"])
        for decision in entry.technical_decisions:
            lines.append(f"- {decision}")

        lines.extend(["", "#### Next Actions Required:"])
        for action in entry.next_actions:
            lines.append(f"- {action}")

        lines.extend(["", "---", ""])

        return "\n".join(lines)

    def update_changelog(self, change_events: List[ChangeEvent]):
        """
        Update the changelog with new change events
        
        Args:
            change_events: List of ChangeEvent objects
        """
        if not change_events:
            return
            
        try:
            # Validate changelog path
            if not self.changelog_path:
                raise ValueError("Changelog path not configured")
                
            # Create file if it doesn't exist
            if not self.changelog_path.exists():
                self.changelog_path.touch()
            
            existing_content = self.changelog_path.read_text(encoding="utf-8")
            
            # Format the new entry
            formatted_entry = "\n".join([self._format_change(ce) for ce in change_events]) + "\n\n"
            
            # Find where to insert the new changes
            header_end = existing_content.find("---\n")
            if header_end != -1:
                insertion_point = header_end + 4
                new_content = (existing_content[:insertion_point] + 
                               formatted_entry +
                               existing_content[insertion_point:])
                self.changelog_path.write_text(new_content, encoding="utf-8")
            else:
                new_content = self._get_changelog_header() + "\n" + formatted_entry + existing_content
                self.changelog_path.write_text(new_content, encoding="utf-8")
                
        except Exception as e:
            logging.error(f"Error updating changelog: {e}")
            # Consider implementing a dead-letter queue or alerting here
            
    def detect_and_update(self, state_manager: StateManager):
        """Detect changes and update changelog with error handling"""
        try:
            changes = state_manager.detect_changes()
            if not changes:
                return
                
            # Format changes for the changelog
            change_events = []
            for change in changes:
                event = ChangeEvent(
                    timestamp=datetime.now(),
                    change_type=change.change_type,
                    file_path=change.file_path,
                    description=change.description,
                    impact=change.impact
                )
                change_events.append(event)
                
            self.update_changelog(change_events)
            
        except Exception as e:
            logging.error(f"Error detecting and updating changelog: {e}")

    def _format_change(self, change: ChangeEvent) -> str:
        """Format a change event for the changelog"""
        change_type = change.change_type
        if change_type == "ADDED":
            symbol = "+"
        elif change_type == "MODIFIED":
            symbol = "*"
        elif change_type == "REMOVED":
            symbol = "-"
        else:
            symbol = "?"

        return f"{symbol} {change.file_path} ({change.impact_level} impact)"

    def _get_changelog_header(self) -> str:
        """Generate changelog header"""
        return (
            "# Changelog\n"
            "All notable changes to this project will be documented in this file.\n"
            "The format is based on [Keep a Changelog](https://keepachangelog.com/)\n"
            "and this project adheres to [Semantic Versioning](https://semver.org/).\n"
            "\n"
            "---\n"
        )
