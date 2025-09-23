#!/usr/bin/env python3
"""
Workspace Mapper Usage Examples
==============================

Practical examples showing how to use the workspace mapper for AI agent integration.
"""

import json
import os
from pathlib import Path
from workspace_mapper import WorkspaceMapper
from simple_search import SimpleWorkspaceSearch


def example_1_basic_project_analysis():
    """Example 1: Basic project analysis and statistics."""
    print("=" * 60)
    print("EXAMPLE 1: Basic Project Analysis")
    print("=" * 60)
    
    # Load existing mapping
    if Path('workspace_mapping.json').exists():
        with open('workspace_mapping.json', 'r', encoding='utf-8') as f:
            mapping = json.load(f)
        
        stats = mapping['statistics']
        analysis = mapping['analysis']
        
        print(f"📊 Project Overview:")
        print(f"   Total Files: {stats['total_files']}")
        print(f"   Total Directories: {stats['total_directories']}")
        print(f"   Processing Time: {stats['processing_time']:.2f}s")
        
        print(f"\n🧪 Code Quality Metrics:")
        test_ratio = len(analysis['test_files']) / stats['total_files']
        print(f"   Test Coverage: {test_ratio:.1%} ({len(analysis['test_files'])} test files)")
        print(f"   API Endpoints: {len(analysis['api_endpoints'])}")
        print(f"   Documentation Files: {len(analysis['documentation'])}")
        
        print(f"\n📈 File Type Distribution:")
        file_types = stats['file_types']
        if hasattr(file_types, 'most_common'):
            # Counter object
            for file_type, count in list(file_types.most_common(5)):
                percentage = (count / stats['total_files']) * 100
                print(f"   {file_type}: {count} files ({percentage:.1f}%)")
        else:
            # Regular dict - sort by count
            sorted_types = sorted(file_types.items(), key=lambda x: x[1], reverse=True)
            for file_type, count in sorted_types[:5]:
                percentage = (count / stats['total_files']) * 100
                print(f"   {file_type}: {count} files ({percentage:.1f}%)")
        
        return mapping
    else:
        print("❌ No workspace mapping found. Run 'python cli_tool.py map .' first.")
        return None


def example_2_search_functionality():
    """Example 2: Demonstrate search capabilities."""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Search Functionality")
    print("=" * 60)
    
    if not Path('workspace_mapping.json').exists():
        print("❌ No workspace mapping found.")
        return
    
    search = SimpleWorkspaceSearch(".", "workspace_mapping.json")
    
    # Search examples
    search_queries = [
        ("authentication", "🔐 Authentication system"),
        ("API", "🌐 API endpoints"),
        ("test", "🧪 Testing code"),
        ("config", "⚙️ Configuration"),
        ("database", "💾 Database operations")
    ]
    
    for query, description in search_queries:
        print(f"\n{description}")
        print(f"Query: '{query}'")
        
        results = search.search_files(query, max_results=3)
        if results:
            print(f"Found {len(results)} matches:")
            for i, result in enumerate(results, 1):
                content_preview = result.content[:80] + "..." if len(result.content) > 80 else result.content
                print(f"   {i}. {result.file_path}:{result.line_number}")
                print(f"      {content_preview}")
                print(f"      Score: {result.relevance_score:.2f}")
        else:
            print("   No matches found")


def example_3_function_discovery():
    """Example 3: Function and import discovery."""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: Function and Import Discovery")
    print("=" * 60)
    
    if not Path('workspace_mapping.json').exists():
        print("❌ No workspace mapping found.")
        return
    
    search = SimpleWorkspaceSearch(".", "workspace_mapping.json")
    
    # Function search examples
    print("🔍 Function Discovery:")
    common_functions = ["main", "init", "setup", "config", "test", "start", "run"]
    
    found_functions = []
    for func_name in common_functions:
        results = search.find_functions(func_name, max_results=2)
        if results:
            found_functions.append((func_name, results))
    
    if found_functions:
        for func_name, results in found_functions[:3]:  # Show first 3
            print(f"\n📍 Function '{func_name}' found in:")
            for result in results:
                print(f"   • {result.file_path}:{result.line_number}")
                print(f"     {result.content[:60]}...")
    else:
        print("   No common functions found")
    
    # Import analysis
    print(f"\n📦 Import Analysis:")
    common_modules = ["express", "react", "jest", "path", "fs", "axios", "lodash"]
    
    found_imports = []
    for module in common_modules:
        results = search.find_imports(module, max_results=2)
        if results:
            found_imports.append((module, results))
    
    if found_imports:
        for module, results in found_imports[:3]:  # Show first 3
            print(f"\n📦 Module '{module}' imported in:")
            for result in results:
                print(f"   • {result.file_path}:{result.line_number}")
                print(f"     {result.content}")
    else:
        print("   No common module imports found")


def example_4_ai_context_generation():
    """Example 4: Generate context for AI agents."""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: AI Context Generation")
    print("=" * 60)
    
    if not Path('workspace_mapping.json').exists():
        print("❌ No workspace mapping found.")
        return
    
    search = SimpleWorkspaceSearch(".", "workspace_mapping.json")
    
    def generate_ai_context(topic: str):
        """Generate comprehensive context for AI about a specific topic."""
        
        # Search for relevant files
        file_results = search.search_files(topic, max_results=5)
        
        # Search for related functions
        function_results = search.find_functions(topic, max_results=3)
        
        # Get project statistics
        stats = search.get_project_statistics()
        
        context = {
            "topic": topic,
            "project_overview": {
                "total_files": stats['total_files'],
                "test_coverage": f"{stats['test_files']} test files",
                "api_endpoints": stats['api_endpoints'],
                "main_technologies": list(stats['file_types'].keys())[:5]
            },
            "relevant_files": [
                {
                    "path": r.file_path,
                    "line": r.line_number,
                    "content": r.content,
                    "relevance": r.relevance_score
                }
                for r in file_results
            ],
            "related_functions": [
                {
                    "path": r.file_path,
                    "line": r.line_number,
                    "definition": r.content
                }
                for r in function_results
            ]
        }
        
        return context
    
    # Generate context for different topics
    topics = ["authentication", "API", "database"]
    
    for topic in topics:
        print(f"\n🤖 AI Context for '{topic}':")
        context = generate_ai_context(topic)
        
        print(f"   Project: {context['project_overview']['total_files']} files, "
              f"{context['project_overview']['api_endpoints']} API endpoints")
        
        if context['relevant_files']:
            print(f"   Relevant Files: {len(context['relevant_files'])} found")
            for file_info in context['relevant_files'][:2]:
                print(f"     • {file_info['path']}:{file_info['line']} (score: {file_info['relevance']:.2f})")
        
        if context['related_functions']:
            print(f"   Related Functions: {len(context['related_functions'])} found")
            for func_info in context['related_functions'][:2]:
                print(f"     • {func_info['path']}:{func_info['line']}")


def example_5_project_health_analysis():
    """Example 5: Project health and recommendations."""
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Project Health Analysis")
    print("=" * 60)
    
    if not Path('workspace_mapping.json').exists():
        print("❌ No workspace mapping found.")
        return
    
    with open('workspace_mapping.json', 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    stats = mapping['statistics']
    analysis = mapping['analysis']
    deps = mapping['dependencies']
    
    print("🏥 Project Health Report:")
    
    # Test coverage analysis
    test_ratio = len(analysis['test_files']) / stats['total_files']
    print(f"\n🧪 Test Coverage: {test_ratio:.1%}")
    if test_ratio > 0.3:
        print("   ✅ Excellent test coverage")
    elif test_ratio > 0.15:
        print("   ⚠️  Good test coverage")
    else:
        print("   ❌ Low test coverage - needs improvement")
    
    # Documentation analysis
    doc_ratio = len(analysis['documentation']) / stats['total_files']
    print(f"\n📚 Documentation: {doc_ratio:.1%}")
    if doc_ratio > 0.1:
        print("   ✅ Well documented")
    else:
        print("   ⚠️  Could use more documentation")
    
    # Dependency health
    print(f"\n🔄 Dependencies:")
    print(f"   External: {len(deps['external_deps'])}")
    print(f"   Circular: {len(deps['circular_deps'])}")
    
    if deps['circular_deps']:
        print("   ❌ Circular dependencies detected:")
        for i, cycle in enumerate(deps['circular_deps'][:3], 1):
            cycle_str = " → ".join(cycle)
            if len(cycle_str) > 60:
                cycle_str = cycle_str[:57] + "..."
            print(f"     {i}. {cycle_str}")
    else:
        print("   ✅ No circular dependencies")
    
    # File size analysis
    largest_files = stats.get('largest_files', [])
    if largest_files:
        print(f"\n📄 Largest Files:")
        for file_info in largest_files[:3]:
            size_mb = file_info['size'] / (1024 * 1024)
            print(f"   • {file_info['path']}: {size_mb:.2f} MB")
    
    # Recommendations
    print(f"\n💡 Recommendations:")
    recommendations = []
    
    if test_ratio < 0.2:
        recommendations.append("Increase test coverage")
    if doc_ratio < 0.05:
        recommendations.append("Add more documentation")
    if deps['circular_deps']:
        recommendations.append("Resolve circular dependencies")
    if len(stats['file_types']) > 15:
        recommendations.append("Consider consolidating file types")
    
    if recommendations:
        for i, rec in enumerate(recommendations, 1):
            print(f"   {i}. {rec}")
    else:
        print("   ✅ Project structure looks healthy!")


def main():
    """Run all examples."""
    print("🚀 Workspace Mapper Usage Examples")
    print("=" * 60)
    
    try:
        # Run examples
        mapping = example_1_basic_project_analysis()
        
        if mapping:
            example_2_search_functionality()
            example_3_function_discovery()
            example_4_ai_context_generation()
            example_5_project_health_analysis()
            
            print("\n" + "=" * 60)
            print("✅ All examples completed successfully!")
            print("=" * 60)
            
            print("\n💡 Next Steps:")
            print("   • Use these patterns in your AI agent integration")
            print("   • Customize search queries for your specific needs")
            print("   • Set up automated health monitoring")
            print("   • Enable semantic search with OpenAI API key")
        
    except Exception as e:
        print(f"\n❌ Error running examples: {str(e)}")
        print("💡 Make sure workspace_mapping.json exists")


if __name__ == '__main__':
    main()
