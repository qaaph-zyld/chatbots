#!/usr/bin/env python3
"""
Changelog System Validation Suite
Ensures the changelog system is production-ready and functioning correctly.
"""

import os
import sys
import configparser
from pathlib import Path

def test_config_file():
    """Test that config.ini exists and has required settings."""
    config_path = Path('config.ini')
    if not config_path.exists():
        return False, "config.ini not found"
    
    config = configparser.ConfigParser()
    config.read(config_path)
    
    required_sections = ['changelog', 'state_manager', 'WindsurfIntegration']
    for section in required_sections:
        if section not in config:
            return False, f"Missing section: {section}"
    
    # Check critical settings
    if not config.getboolean('WindsurfIntegration', 'enable_pre_response_hook', fallback=False):
        return False, "Pre-response hook not enabled"
    
    if not config.getboolean('WindsurfIntegration', 'enable_post_response_hook', fallback=False):
        return False, "Post-response hook not enabled"
    
    return True, "Config validation passed"

def test_changelog_exists():
    """Test that CHANGELOG.md exists and is properly formatted."""
    changelog_path = Path('../../CHANGELOG.md')
    if not changelog_path.exists():
        return False, "CHANGELOG.md not found"
    
    with open(changelog_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '# CHANGELOG' not in content:
        return False, "CHANGELOG.md missing header"
    
    if len(content.strip()) < 100:
        return False, "CHANGELOG.md appears to be empty or too short"
    
    return True, "Changelog validation passed"

def test_python_files():
    """Test that all Python files are syntactically correct."""
    python_files = ['changelog_engine.py', 'windsurf_integration.py']
    
    for file in python_files:
        if not Path(file).exists():
            return False, f"Missing file: {file}"
        
        try:
            with open(file, 'r', encoding='utf-8') as f:
                compile(f.read(), file, 'exec')
        except SyntaxError as e:
            return False, f"Syntax error in {file}: {e}"
    
    return True, "Python files validation passed"

def test_integration_hooks():
    """Test that integration hooks are properly configured."""
    try:
        # Import and test the integration
        sys.path.append('.')
        from windsurf_integration import WindsurfChangelogIntegrator
        
        integrator = WindsurfChangelogIntegrator()
        
        # Test that hooks are enabled
        config = configparser.ConfigParser()
        config.read('config.ini')
        
        pre_hook = config.getboolean('WindsurfIntegration', 'enable_pre_response_hook', fallback=False)
        post_hook = config.getboolean('WindsurfIntegration', 'enable_post_response_hook', fallback=False)
        
        if not pre_hook or not post_hook:
            return False, "Integration hooks not properly enabled"
        
        return True, "Integration hooks validation passed"
    
    except Exception as e:
        return False, f"Integration test failed: {e}"

def run_all_tests():
    """Run all validation tests."""
    tests = [
        ("Config File", test_config_file),
        ("Changelog Exists", test_changelog_exists),
        ("Python Files", test_python_files),
        ("Integration Hooks", test_integration_hooks)
    ]
    
    print("🔍 Running Changelog System Validation Suite...")
    print("=" * 50)
    
    all_passed = True
    
    for test_name, test_func in tests:
        try:
            passed, message = test_func()
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status} {test_name}: {message}")
            
            if not passed:
                all_passed = False
        
        except Exception as e:
            print(f"❌ FAIL {test_name}: Exception - {e}")
            all_passed = False
    
    print("=" * 50)
    
    if all_passed:
        print("🎉 ALL TESTS PASSED - Changelog system is production ready!")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED - Please fix issues before production use")
        return 1

if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
