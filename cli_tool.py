#!/usr/bin/env python3
"""
Workspace Mapper CLI Tool
========================

Command-line interface for workspace mapping, analysis, and semantic search.

Author: Workspace Analysis Framework
Version: 1.0.0
"""

import click
import json
import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any
import logging
from datetime import datetime

# Import our modules
from workspace_mapper import WorkspaceMapper
from semantic_search import SemanticSearchEngine, WorkspaceQuery

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)


@click.group()
@click.version_option(version='1.0.0')
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
def cli(verbose):
    """Workspace Mapper - Comprehensive codebase analysis and search tool."""
    if verbose:
        logging.getLogger().setLevel(logging.DEBUG)


@cli.command()
@click.argument('workspace_path', type=click.Path(exists=True, file_okay=False))
@click.option('--output', '-o', default='workspace_mapping.json', 
              help='Output file path for the mapping')
@click.option('--config', '-c', type=click.Path(exists=True), 
              help='Configuration file path')
@click.option('--include-hidden', is_flag=True, 
              help='Include hidden files and directories')
@click.option('--max-size', default=10, type=int, 
              help='Maximum file size in MB to analyze')
@click.option('--report', is_flag=True, 
              help='Generate a summary report')
def map(workspace_path, output, config, include_hidden, max_size, report):
    """Create a comprehensive mapping of the workspace."""
    click.echo(f"🔍 Analyzing workspace: {workspace_path}")
    
    # Load configuration if provided
    mapper_config = {}
    if config:
        with open(config, 'r') as f:
            mapper_config = json.load(f)
    
    # Update config with CLI options
    mapper_config.update({
        'include_hidden': include_hidden,
        'max_file_size': max_size * 1024 * 1024
    })
    
    try:
        # Create mapper and build mapping
        mapper = WorkspaceMapper(workspace_path, mapper_config)
        mapping = mapper.build_mapping()
        
        # Save mapping
        mapper.save_mapping(output)
        
        # Display summary
        stats = mapping['statistics']
        click.echo(f"\n✅ Analysis complete!")
        click.echo(f"📊 Files analyzed: {stats['total_files']}")
        click.echo(f"📁 Directories: {stats['total_directories']}")
        click.echo(f"⏱️  Processing time: {stats['processing_time']:.2f}s")
        click.echo(f"💾 Mapping saved to: {output}")
        
        # Generate report if requested
        if report:
            report_path = Path(output).with_suffix('.md')
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write(mapper.generate_summary_report())
            click.echo(f"📋 Report saved to: {report_path}")
            
        # Show top file types
        click.echo(f"\n📈 Top file types:")
        for file_type, count in stats['file_types'].most_common(5):
            percentage = (count / stats['total_files']) * 100
            click.echo(f"   {file_type}: {count} files ({percentage:.1f}%)")
            
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('workspace_path', type=click.Path(exists=True, file_okay=False))
@click.option('--output', '-o', default='vector_index', 
              help='Output directory for the vector index')
@click.option('--chunk-size', default=1000, type=int,
              help='Text chunk size for embeddings')
@click.option('--overlap', default=200, type=int,
              help='Chunk overlap size')
@click.option('--extensions', default='.js,.jsx,.ts,.tsx,.py,.md,.json',
              help='File extensions to include (comma-separated)')
def index(workspace_path, output, chunk_size, overlap, extensions):
    """Create a semantic search index of the workspace."""
    click.echo(f"🧠 Creating semantic index for: {workspace_path}")
    
    # Check if required dependencies are available
    try:
        from semantic_search import HAS_LANGCHAIN
        if not HAS_LANGCHAIN:
            click.echo("❌ Error: langchain not available. Install with: pip install langchain openai faiss-cpu", err=True)
            sys.exit(1)
    except ImportError:
        click.echo("❌ Error: semantic_search module not found", err=True)
        sys.exit(1)
    
    # Parse extensions
    ext_list = [ext.strip() for ext in extensions.split(',')]
    
    config = {
        'chunk_size': chunk_size,
        'chunk_overlap': overlap,
        'include_extensions': set(ext_list)
    }
    
    try:
        # Create search engine
        engine = SemanticSearchEngine(workspace_path, config)
        
        # Create index
        if engine.create_index(output):
            click.echo(f"✅ Semantic index created successfully!")
            click.echo(f"💾 Index saved to: {output}")
            
            # Show statistics
            stats = engine.get_statistics()
            if stats:
                click.echo(f"📊 Documents indexed: {stats.get('total_documents', 0)}")
                click.echo(f"📈 File types:")
                for file_type, count in stats.get('file_types', {}).items():
                    click.echo(f"   {file_type}: {count} files")
        else:
            click.echo("❌ Failed to create semantic index", err=True)
            sys.exit(1)
            
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('query')
@click.option('--index', '-i', default='vector_index',
              help='Path to the vector index directory')
@click.option('--workspace', '-w', default='.',
              help='Workspace path')
@click.option('--results', '-n', default=5, type=int,
              help='Number of results to return')
@click.option('--file-type', '-t',
              help='Filter by file type (e.g., .js, .py)')
@click.option('--context', is_flag=True,
              help='Show code context around matches')
def search(query, index, workspace, results, file_type, context):
    """Search the workspace using semantic similarity."""
    click.echo(f"🔍 Searching for: {query}")
    
    try:
        # Initialize search engine
        engine = SemanticSearchEngine(workspace)
        
        if not engine.load_index(index):
            click.echo(f"❌ Failed to load index from: {index}", err=True)
            click.echo("💡 Create an index first with: workspace-mapper index <workspace_path>")
            sys.exit(1)
        
        # Perform search
        if file_type:
            search_results = engine.search_by_file_type(query, file_type, results)
        else:
            search_results = engine.search(query, results)
        
        if not search_results:
            click.echo("❌ No results found")
            return
        
        click.echo(f"\n✅ Found {len(search_results)} results:\n")
        
        for i, result in enumerate(search_results, 1):
            click.echo(f"📄 Result {i}: {result.file_path}")
            click.echo(f"   Score: {result.score:.3f}")
            click.echo(f"   Lines: {result.start_line}-{result.end_line}")
            
            # Show content preview
            preview = result.content[:200].replace('\n', ' ')
            if len(result.content) > 200:
                preview += "..."
            click.echo(f"   Preview: {preview}")
            
            # Show context if requested
            if context:
                code_context = engine.get_code_context(
                    result.file_path, 
                    result.start_line + 5,  # Approximate middle
                    context_lines=3
                )
                if code_context:
                    click.echo(f"   Context:")
                    for line in code_context.split('\n')[:6]:  # Limit lines
                        click.echo(f"     {line}")
            
            click.echo()
            
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('question')
@click.option('--workspace', '-w', default='.',
              help='Workspace path')
@click.option('--mapping', '-m', default='workspace_mapping.json',
              help='Path to workspace mapping file')
@click.option('--index', '-i', default='vector_index',
              help='Path to vector index directory')
def ask(question, workspace, mapping, index):
    """Ask a question about the workspace and get an intelligent answer."""
    click.echo(f"❓ Question: {question}")
    
    try:
        # Initialize query interface
        query_interface = WorkspaceQuery(workspace, mapping, index)
        
        # Get answer
        result = query_interface.query(question)
        
        click.echo(f"\n💡 Answer:")
        click.echo(f"   {result['answer']}")
        click.echo(f"   Confidence: {result['confidence']:.2f}")
        
        if result['sources']:
            click.echo(f"\n📚 Sources:")
            for i, source in enumerate(result['sources'], 1):
                click.echo(f"   {i}. {source['file']} (score: {source['score']:.3f})")
                if len(source['content']) > 100:
                    preview = source['content'][:100] + "..."
                else:
                    preview = source['content']
                click.echo(f"      {preview.replace(chr(10), ' ')}")
        
        if result['suggestions']:
            click.echo(f"\n💭 Suggestions:")
            for suggestion in result['suggestions']:
                click.echo(f"   • {suggestion}")
                
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('file_path')
@click.option('--workspace', '-w', default='.',
              help='Workspace path')
@click.option('--index', '-i', default='vector_index',
              help='Path to vector index directory')
@click.option('--results', '-n', default=5, type=int,
              help='Number of similar files to find')
def similar(file_path, workspace, index, results):
    """Find files similar to the given file."""
    click.echo(f"🔍 Finding files similar to: {file_path}")
    
    try:
        # Initialize search engine
        engine = SemanticSearchEngine(workspace)
        
        if not engine.load_index(index):
            click.echo(f"❌ Failed to load index from: {index}", err=True)
            sys.exit(1)
        
        # Find similar files
        similar_files = engine.find_similar_files(file_path, results)
        
        if not similar_files:
            click.echo("❌ No similar files found")
            return
        
        click.echo(f"\n✅ Found {len(similar_files)} similar files:\n")
        
        for i, result in enumerate(similar_files, 1):
            click.echo(f"📄 {i}. {result.file_path}")
            click.echo(f"   Similarity: {result.score:.3f}")
            
            # Show brief content preview
            preview = result.content[:150].replace('\n', ' ')
            if len(result.content) > 150:
                preview += "..."
            click.echo(f"   Preview: {preview}")
            click.echo()
            
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}", err=True)
        sys.exit(1)


@cli.command()
@click.option('--workspace', '-w', default='.',
              help='Workspace path')
@click.option('--mapping', '-m', default='workspace_mapping.json',
              help='Path to workspace mapping file')
@click.option('--index', '-i', default='vector_index',
              help='Path to vector index directory')
def status(workspace, mapping, index):
    """Show status of workspace analysis and search index."""
    click.echo("📊 Workspace Analysis Status\n")
    
    # Check workspace mapping
    mapping_path = Path(mapping)
    if mapping_path.exists():
        try:
            with open(mapping_path, 'r') as f:
                mapping_data = json.load(f)
            
            stats = mapping_data.get('statistics', {})
            metadata = mapping_data.get('metadata', {})
            
            click.echo(f"✅ Workspace Mapping: {mapping}")
            click.echo(f"   Generated: {metadata.get('generated', 'Unknown')}")
            click.echo(f"   Files: {stats.get('total_files', 0)}")
            click.echo(f"   Directories: {stats.get('total_directories', 0)}")
            click.echo(f"   Processing time: {stats.get('processing_time', 0):.2f}s")
            
        except Exception as e:
            click.echo(f"❌ Workspace Mapping: Error reading {mapping}")
    else:
        click.echo(f"❌ Workspace Mapping: Not found ({mapping})")
    
    click.echo()
    
    # Check search index
    index_path = Path(index)
    if index_path.exists():
        metadata_file = index_path / 'metadata.json'
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r') as f:
                    index_metadata = json.load(f)
                
                created = datetime.fromtimestamp(index_metadata.get('created', 0))
                click.echo(f"✅ Search Index: {index}")
                click.echo(f"   Created: {created.strftime('%Y-%m-%d %H:%M:%S')}")
                click.echo(f"   Documents: {index_metadata.get('num_documents', 0)}")
                click.echo(f"   Chunks: {index_metadata.get('num_chunks', 0)}")
                
            except Exception as e:
                click.echo(f"❌ Search Index: Error reading metadata")
        else:
            click.echo(f"⚠️  Search Index: Found but no metadata")
    else:
        click.echo(f"❌ Search Index: Not found ({index})")
    
    click.echo()
    
    # Recommendations
    click.echo("💡 Recommendations:")
    if not mapping_path.exists():
        click.echo("   • Create workspace mapping: workspace-mapper map <workspace_path>")
    if not index_path.exists():
        click.echo("   • Create search index: workspace-mapper index <workspace_path>")
    if mapping_path.exists() and index_path.exists():
        click.echo("   • Everything looks good! Try: workspace-mapper ask 'How does authentication work?'")


@cli.command()
@click.option('--workspace', '-w', default='.',
              help='Workspace path')
@click.option('--output', '-o', default='workspace_analysis_complete.json',
              help='Output file for complete analysis')
def analyze(workspace, output):
    """Perform complete workspace analysis (mapping + indexing)."""
    click.echo(f"🚀 Starting complete workspace analysis: {workspace}")
    
    try:
        # Step 1: Create mapping
        click.echo("\n📋 Step 1: Creating workspace mapping...")
        mapper = WorkspaceMapper(workspace)
        mapping = mapper.build_mapping()
        
        mapping_file = 'workspace_mapping.json'
        mapper.save_mapping(mapping_file)
        
        stats = mapping['statistics']
        click.echo(f"   ✅ Mapped {stats['total_files']} files in {stats['processing_time']:.2f}s")
        
        # Step 2: Create search index
        click.echo("\n🧠 Step 2: Creating semantic search index...")
        try:
            from semantic_search import HAS_LANGCHAIN
            if HAS_LANGCHAIN:
                engine = SemanticSearchEngine(workspace)
                if engine.create_index():
                    click.echo(f"   ✅ Search index created successfully")
                else:
                    click.echo(f"   ⚠️  Search index creation failed")
            else:
                click.echo(f"   ⚠️  Langchain not available - skipping search index")
        except Exception as e:
            click.echo(f"   ⚠️  Search index creation failed: {e}")
        
        # Step 3: Generate comprehensive report
        click.echo("\n📊 Step 3: Generating comprehensive report...")
        
        complete_analysis = {
            'metadata': {
                'generated': datetime.now().isoformat(),
                'workspace_path': str(Path(workspace).resolve()),
                'analysis_type': 'complete'
            },
            'mapping': mapping,
            'recommendations': [],
            'next_steps': []
        }
        
        # Add recommendations based on analysis
        if mapping['dependencies']['circular_deps']:
            complete_analysis['recommendations'].append({
                'type': 'warning',
                'message': f"Found {len(mapping['dependencies']['circular_deps'])} circular dependencies",
                'action': 'Review and refactor circular imports'
            })
        
        if len(mapping['analysis']['test_files']) < stats['total_files'] * 0.1:
            complete_analysis['recommendations'].append({
                'type': 'suggestion',
                'message': 'Low test coverage detected',
                'action': 'Consider adding more test files'
            })
        
        # Save complete analysis
        with open(output, 'w', encoding='utf-8') as f:
            json.dump(complete_analysis, f, indent=2, ensure_ascii=False)
        
        click.echo(f"   ✅ Complete analysis saved to: {output}")
        
        # Summary
        click.echo(f"\n🎉 Analysis Complete!")
        click.echo(f"   📁 Files analyzed: {stats['total_files']}")
        click.echo(f"   🔍 Search ready: {'Yes' if HAS_LANGCHAIN else 'No (install langchain)'}")
        click.echo(f"   📋 Report: {output}")
        
        click.echo(f"\n💡 Try these commands:")
        click.echo(f"   workspace-mapper search 'authentication'")
        click.echo(f"   workspace-mapper ask 'How does the API work?'")
        click.echo(f"   workspace-mapper status")
        
    except Exception as e:
        click.echo(f"❌ Error during analysis: {str(e)}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    cli()
