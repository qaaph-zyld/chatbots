#!/usr/bin/env python3
"""
Workspace Mapper Demo Script
===========================

Demonstrates the key features of the workspace mapper tool.
"""

import json
import time
from pathlib import Path
from workspace_mapper import WorkspaceMapper
from simple_search import SimpleWorkspaceSearch


def print_header(title: str):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)


def print_section(title: str):
    """Print a formatted section header."""
    print(f"\n🔹 {title}")
    print("-" * 40)


def demo_workspace_analysis():
    """Demonstrate workspace analysis capabilities."""
    print_header("WORKSPACE MAPPER DEMO")
    
    workspace_path = "."
    print(f"📁 Analyzing workspace: {Path(workspace_path).resolve()}")
    
    # Create mapper with custom config
    config = {
        'max_file_size': 5 * 1024 * 1024,  # 5MB limit for demo
        'include_hidden': False
    }
    
    print_section("Creating Workspace Mapping")
    start_time = time.time()
    
    mapper = WorkspaceMapper(workspace_path, config)
    mapping = mapper.build_mapping()
    
    processing_time = time.time() - start_time
    print(f"✅ Analysis completed in {processing_time:.2f} seconds")
    
    # Display statistics
    stats = mapping['statistics']
    print_section("Project Statistics")
    print(f"📊 Total Files: {stats['total_files']}")
    print(f"📁 Total Directories: {stats['total_directories']}")
    print(f"⏱️  Processing Time: {stats['processing_time']:.2f}s")
    
    print("\n📈 Top File Types:")
    for file_type, count in list(stats['file_types'].most_common(5)):
        percentage = (count / stats['total_files']) * 100
        print(f"   • {file_type}: {count} files ({percentage:.1f}%)")
    
    # Analysis results
    analysis = mapping['analysis']
    print_section("Code Analysis Results")
    print(f"🧪 Test Files: {len(analysis['test_files'])}")
    print(f"⚙️  Configuration Files: {len(analysis['config_files'])}")
    print(f"📚 Documentation Files: {len(analysis['documentation'])}")
    print(f"🌐 API Endpoints: {len(analysis['api_endpoints'])}")
    
    # Dependencies
    deps = mapping['dependencies']
    print_section("Dependency Analysis")
    print(f"📦 External Dependencies: {len(deps['external_deps'])}")
    print(f"🔄 Circular Dependencies: {len(deps['circular_deps'])}")
    
    if deps['circular_deps']:
        print("\n⚠️  Circular Dependencies Found:")
        for i, cycle in enumerate(deps['circular_deps'][:3], 1):
            cycle_str = " → ".join(cycle)
            if len(cycle_str) > 80:
                cycle_str = cycle_str[:77] + "..."
            print(f"   {i}. {cycle_str}")
    
    # Save mapping for search demo
    mapping_file = 'demo_workspace_mapping.json'
    mapper.save_mapping(mapping_file)
    print(f"\n💾 Mapping saved to: {mapping_file}")
    
    return mapping_file


def demo_search_capabilities(mapping_file: str):
    """Demonstrate search capabilities."""
    print_header("SEARCH CAPABILITIES DEMO")
    
    # Initialize search
    search = SimpleWorkspaceSearch(".", mapping_file)
    
    # Demo queries
    demo_queries = [
        ("authentication", "🔐 Authentication-related code"),
        ("test", "🧪 Test-related files"),
        ("config", "⚙️ Configuration files"),
        ("API", "🌐 API-related code"),
        ("function", "⚡ Function definitions")
    ]
    
    for query, description in demo_queries:
        print_section(f"Searching: {description}")
        print(f"Query: '{query}'")
        
        results = search.search_files(query, max_results=3)
        
        if results:
            print(f"Found {len(results)} matches:")
            for i, result in enumerate(results, 1):
                print(f"   {i}. {result.file_path}:{result.line_number}")
                content = result.content[:60] + "..." if len(result.content) > 60 else result.content
                print(f"      {content}")
                print(f"      Score: {result.relevance_score:.2f}")
        else:
            print("   No matches found")
    
    # Function search demo
    print_section("Function Search Demo")
    functions_to_find = ["main", "test", "config", "setup", "init"]
    
    for func_name in functions_to_find:
        results = search.find_functions(func_name, max_results=2)
        if results:
            print(f"📍 Function '{func_name}' found in:")
            for result in results:
                print(f"   • {result.file_path}:{result.line_number}")
            break
    
    # Import analysis demo
    print_section("Import Analysis Demo")
    common_imports = ["express", "react", "jest", "path", "fs"]
    
    for module in common_imports:
        results = search.find_imports(module, max_results=2)
        if results:
            print(f"📦 Module '{module}' imported in:")
            for result in results:
                print(f"   • {result.file_path}:{result.line_number}")
            break


def demo_project_insights(mapping_file: str):
    """Demonstrate project insights and recommendations."""
    print_header("PROJECT INSIGHTS & RECOMMENDATIONS")
    
    # Load mapping for analysis
    with open(mapping_file, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    stats = mapping['statistics']
    analysis = mapping['analysis']
    deps = mapping['dependencies']
    
    print_section("Code Quality Insights")
    
    # Test coverage analysis
    test_ratio = len(analysis['test_files']) / stats['total_files']
    if test_ratio > 0.3:
        print("✅ Good test coverage detected")
    elif test_ratio > 0.1:
        print("⚠️  Moderate test coverage - consider adding more tests")
    else:
        print("❌ Low test coverage - significant testing needed")
    
    print(f"   Test files: {len(analysis['test_files'])} ({test_ratio:.1%})")
    
    # Documentation analysis
    doc_ratio = len(analysis['documentation']) / stats['total_files']
    if doc_ratio > 0.1:
        print("✅ Well-documented project")
    else:
        print("⚠️  Consider adding more documentation")
    
    print(f"   Documentation files: {len(analysis['documentation'])} ({doc_ratio:.1%})")
    
    # Dependency analysis
    if deps['circular_deps']:
        print(f"⚠️  {len(deps['circular_deps'])} circular dependencies need attention")
    else:
        print("✅ No circular dependencies detected")
    
    # File size analysis
    largest_files = stats.get('largest_files', [])
    if largest_files:
        print_section("Largest Files (Potential Optimization Targets)")
        for file_info in largest_files[:3]:
            size_mb = file_info['size'] / (1024 * 1024)
            print(f"   📄 {file_info['path']}: {size_mb:.2f} MB")
    
    # API endpoint analysis
    if analysis['api_endpoints']:
        print_section("API Endpoints Detected")
        endpoint_methods = {}
        for endpoint in analysis['api_endpoints'][:10]:  # Show first 10
            method = endpoint.get('method', 'UNKNOWN')
            endpoint_methods[method] = endpoint_methods.get(method, 0) + 1
        
        print(f"   Total endpoints: {len(analysis['api_endpoints'])}")
        for method, count in endpoint_methods.items():
            print(f"   {method}: {count} endpoints")
    
    print_section("Recommendations")
    recommendations = []
    
    if test_ratio < 0.2:
        recommendations.append("🧪 Increase test coverage - aim for at least 20% test files")
    
    if doc_ratio < 0.05:
        recommendations.append("📚 Add more documentation files (README, API docs, etc.)")
    
    if deps['circular_deps']:
        recommendations.append("🔄 Resolve circular dependencies to improve maintainability")
    
    if len(stats['file_types']) > 10:
        recommendations.append("🎯 Consider consolidating file types for better organization")
    
    if not recommendations:
        recommendations.append("✅ Project structure looks good!")
    
    for rec in recommendations:
        print(f"   {rec}")


def main():
    """Run the complete demo."""
    try:
        # Step 1: Analyze workspace
        mapping_file = demo_workspace_analysis()
        
        # Step 2: Demonstrate search
        demo_search_capabilities(mapping_file)
        
        # Step 3: Show insights
        demo_project_insights(mapping_file)
        
        print_header("DEMO COMPLETE")
        print("🎉 Workspace Mapper demo completed successfully!")
        print("\n💡 Next steps:")
        print("   • Run 'python cli_tool.py --help' for full CLI options")
        print("   • Try 'python simple_search.py <query>' for quick searches")
        print("   • Check the generated reports for detailed analysis")
        print(f"   • Explore the mapping file: {mapping_file}")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {str(e)}")
        print("💡 Make sure you're in a directory with code files to analyze")


if __name__ == '__main__':
    main()
