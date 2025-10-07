#!/usr/bin/env python3
"""
Setup script for Workspace Mapper
"""

from setuptools import setup, find_packages

setup(
    name='workspace-mapper',
    version='1.0.0',
    description='Comprehensive workspace mapping and semantic search tool',
    author='Workspace Analysis Framework',
    python_requires='>=3.8',
    py_modules=['workspace_mapper', 'semantic_search', 'cli_tool'],
    install_requires=[
        'click>=8.0.0',
        'python-dotenv>=0.19.0',
        'typing-extensions>=4.0.0',
        'esprima>=4.0.1',
        'beautifulsoup4>=4.10.0',
        'markdown>=3.4.0',
        'langchain>=0.0.200',
        'openai>=0.27.0',
        'faiss-cpu>=1.7.0',
        'tiktoken>=0.4.0',
    ],
    entry_points={
        'console_scripts': [
            'workspace-mapper=cli_tool:cli',
        ],
    },
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
    ],
)
