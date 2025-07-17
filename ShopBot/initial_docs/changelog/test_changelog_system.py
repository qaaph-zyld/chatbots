"""Validation tests for changelog system"""
import unittest
import tempfile
import os
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from changelog_engine import ChangelogEngine, ChangeEvent
from state_manager_py import StateManager
from windsurf_integration import WindsurfChangelogIntegrator


class TestChangelogSystem(unittest.TestCase):
    def setUp(self):
        # Create temporary directory
        self.test_dir = tempfile.TemporaryDirectory()
        self.base_path = Path(self.test_dir.name)
        
        # Create changelog file
        self.changelog_path = self.base_path / "CHANGELOG.md"
        self.changelog_path.touch()
        
        # Create configuration
        self.config_path = self.base_path / "config.ini"
        with open(self.config_path, 'w') as f:
            f.write(
                """[Changelog]\npath = CHANGELOG.md\n\n"""
                """[StateManager]\ncache_dir = .workspace_cache\n\n"""
                """[WindsurfIntegration]\nenable_pre_response_hook = true\n"""
                """enable_post_response_hook = true"""
            )
        
        # Initialize components
        self.state_manager = StateManager(cache_dir=str(self.base_path / ".workspace_cache"))
        self.changelog_engine = ChangelogEngine(str(self.changelog_path))
        self.integrator = WindsurfChangelogIntegrator(str(self.config_path))
    
    def tearDown(self):
        self.test_dir.cleanup()
    
    def test_changelog_update(self):
        """Test basic changelog update functionality"""
        # Create test change event
        change_event = ChangeEvent(
            timestamp=datetime.now(),
            change_type="ADDED",
            file_path="test.py",
            description="Test file creation",
            impact="LOW"
        )
        
        # Update changelog
        self.changelog_engine.update_changelog([change_event])
        
        # Verify update
        content = self.changelog_path.read_text()
        self.assertIn("Test file creation", content)
        self.assertIn("+", content)  # Added symbol
    
    def test_integration_hooks(self):
        """Test integration hooks execute without errors"""
        # Should not raise exceptions
        self.integrator.pre_response_hook()
        self.integrator.post_response_hook()
    
    def test_error_handling(self):
        """Test error handling in changelog updates"""
        # Invalid changelog path should be handled gracefully
        invalid_engine = ChangelogEngine("/invalid/path/CHANGELOG.md")
        invalid_engine.update_changelog([])

if __name__ == "__main__":
    unittest.main()
