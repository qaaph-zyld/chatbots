from state_manager_py import StateManager
from changelog_engine import ChangelogEngine
import configparser
import logging

class WindsurfChangelogIntegrator:
    def __init__(self, config_path='config.ini'):
        self.config = configparser.ConfigParser()
        self.config.read(config_path)
        cache_dir = self.config['StateManager']['cache_dir']
        changelog_path = self.config['Changelog']['path']
        self.state_manager = StateManager(cache_dir)
        self.changelog_engine = ChangelogEngine(changelog_path)

    def pre_response_hook(self):
        """Hook to be called before generating a response."""
        try:
            if self.config.getboolean('WindsurfIntegration', 'enable_pre_response_hook', fallback=False):
                self.changelog_engine.detect_and_update(self.state_manager)
        except Exception as e:
            logging.error(f"Error in pre_response_hook: {e}")
            
    def post_response_hook(self):
        """Hook to be called after generating a response."""
        try:
            if self.config.getboolean('WindsurfIntegration', 'enable_post_response_hook', fallback=False):
                # Persist state changes after response
                self.state_manager.persist_cache()
                # Finalize any pending changelog entries
                self.changelog_engine.finalize_entries()
        except Exception as e:
            logging.error(f"Error in post_response_hook: {e}")
