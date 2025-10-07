#!/usr/bin/env python3
"""
AI Agent Helper - Workspace Mapper Integration
==============================================

Helper functions to integrate workspace mapper with AI agents for enhanced context.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
from simple_search import SimpleWorkspaceSearch


class AIAgentHelper:
    """Helper class for AI agent integration with workspace mapper."""
    
    def __init__(self, workspace_path: str = ".", mapping_file: str = "workspace_mapping.json"):
        """Initialize the AI agent helper."""
        self.workspace_path = workspace_path
        self.mapping_file = mapping_file
        self.search = SimpleWorkspaceSearch(workspace_path, mapping_file)
        
        # Load mapping data
        self.mapping_data = None
        if Path(mapping_file).exists():
            with open(mapping_file, 'r', encoding='utf-8') as f:
                self.mapping_data = json.load(f)
    
    def get_project_context(self) -> Dict[str, Any]:
        """Get comprehensive project context for AI agents."""
        if not self.mapping_data:
            return {"error": "No workspace mapping available"}
        
        stats = self.mapping_data['statistics']
        analysis = self.mapping_data['analysis']
        deps = self.mapping_data['dependencies']
        
        context = {
            "project_overview": {
                "name": "Chatbot Project",
                "total_files": stats['total_files'],
                "total_directories": stats['total_directories'],
                "processing_time": stats['processing_time'],
                "last_analyzed": self.mapping_data['metadata']['generated']
            },
            "code_quality": {
                "test_files": len(analysis['test_files']),
                "test_coverage_ratio": len(analysis['test_files']) / stats['total_files'],
                "documentation_files": len(analysis['documentation']),
                "api_endpoints": len(analysis['api_endpoints']),
                "circular_dependencies": len(deps['circular_deps'])
            },
            "technology_stack": {
                "primary_languages": ["JavaScript", "TypeScript", "Python"],
                "frameworks": ["React", "Node.js", "Express", "Jest"],
                "file_types": dict(list(sorted(stats['file_types'].items(), key=lambda x: x[1], reverse=True))[:10])
            },
            "architecture": {
                "entry_points": analysis.get('entry_points', []),
                "main_directories": list(self.mapping_data['structure']['directories'].keys())[:10],
                "external_dependencies": list(deps['external_deps'])[:20]
            }
        }
        
        return context
    
    def search_for_context(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        """Search for relevant code context based on a query."""
        results = self.search.search_files(query, max_results=max_results)
        
        context = {
            "query": query,
            "found_matches": len(results),
            "relevant_files": [],
            "code_snippets": [],
            "summary": f"Found {len(results)} relevant files for '{query}'"
        }
        
        for result in results:
            context["relevant_files"].append({
                "path": result.file_path,
                "line": result.line_number,
                "relevance_score": result.relevance_score
            })
            
            context["code_snippets"].append({
                "file": result.file_path,
                "line": result.line_number,
                "content": result.content,
                "context": result.match_context if hasattr(result, 'match_context') else ""
            })
        
        return context
    
    def get_function_info(self, function_name: str) -> Dict[str, Any]:
        """Get information about a specific function across the codebase."""
        results = self.search.find_functions(function_name, max_results=10)
        
        return {
            "function_name": function_name,
            "found_in_files": len(results),
            "definitions": [
                {
                    "file": result.file_path,
                    "line": result.line_number,
                    "definition": result.content
                }
                for result in results
            ]
        }
    
    def get_module_usage(self, module_name: str) -> Dict[str, Any]:
        """Get information about module usage across the codebase."""
        results = self.search.find_imports(module_name, max_results=15)
        
        return {
            "module_name": module_name,
            "used_in_files": len(results),
            "import_statements": [
                {
                    "file": result.file_path,
                    "line": result.line_number,
                    "statement": result.content
                }
                for result in results
            ]
        }
    
    def analyze_feature_area(self, feature_name: str) -> Dict[str, Any]:
        """Analyze a specific feature area (e.g., authentication, API, database)."""
        # Search for files related to the feature
        file_results = self.search.search_files(feature_name, max_results=10)
        
        # Search for functions related to the feature
        function_results = self.search.find_functions(feature_name, max_results=5)
        
        # Get project stats for context
        stats = self.search.get_project_statistics()
        
        analysis = {
            "feature_name": feature_name,
            "analysis_summary": {
                "related_files": len(file_results),
                "related_functions": len(function_results),
                "coverage_percentage": (len(file_results) / stats['total_files']) * 100
            },
            "key_files": [
                {
                    "path": result.file_path,
                    "relevance": result.relevance_score,
                    "content_preview": result.content[:100] + "..." if len(result.content) > 100 else result.content
                }
                for result in file_results[:5]
            ],
            "key_functions": [
                {
                    "name": function_name,
                    "file": result.file_path,
                    "definition": result.content
                }
                for result in function_results
                for function_name in [feature_name]  # Simplified for demo
            ],
            "recommendations": self._generate_feature_recommendations(feature_name, file_results, function_results)
        }
        
        return analysis
    
    def _generate_feature_recommendations(self, feature_name: str, file_results: List, function_results: List) -> List[str]:
        """Generate recommendations for a feature area."""
        recommendations = []
        
        if len(file_results) == 0:
            recommendations.append(f"No files found for '{feature_name}' - consider implementing this feature")
        elif len(file_results) == 1:
            recommendations.append(f"Only one file found for '{feature_name}' - consider if more modular approach needed")
        elif len(file_results) > 10:
            recommendations.append(f"Many files ({len(file_results)}) related to '{feature_name}' - consider consolidation")
        
        if len(function_results) == 0:
            recommendations.append(f"No specific functions found for '{feature_name}' - may need better naming or organization")
        
        return recommendations
    
    def get_ai_prompt_context(self, user_question: str) -> str:
        """Generate comprehensive context for AI prompts."""
        # Get project overview
        project_ctx = self.get_project_context()
        
        # Search for relevant code
        search_ctx = self.search_for_context(user_question, max_results=3)
        
        # Build context string
        context = f"""
PROJECT CONTEXT:
- Project: {project_ctx['project_overview']['name']}
- Files: {project_ctx['project_overview']['total_files']}
- Test Coverage: {project_ctx['code_quality']['test_coverage_ratio']:.1%} ({project_ctx['code_quality']['test_files']} test files)
- API Endpoints: {project_ctx['code_quality']['api_endpoints']}
- Technologies: {', '.join(project_ctx['technology_stack']['primary_languages'])}

RELEVANT CODE FOR "{user_question}":
"""
        
        if search_ctx['found_matches'] > 0:
            context += f"Found {search_ctx['found_matches']} relevant files:\n"
            for snippet in search_ctx['code_snippets'][:3]:
                context += f"\n{snippet['file']}:{snippet['line']}\n{snippet['content']}\n"
        else:
            context += "No specific code found - this may be a new feature area.\n"
        
        context += f"""
PROJECT HEALTH:
- Circular Dependencies: {project_ctx['code_quality']['circular_dependencies']}
- Documentation Files: {project_ctx['code_quality']['documentation_files']}

Use this context to provide accurate, project-specific answers.
"""
        
        return context
    
    def get_development_insights(self) -> Dict[str, Any]:
        """Get insights for development planning."""
        if not self.mapping_data:
            return {"error": "No mapping data available"}
        
        stats = self.mapping_data['statistics']
        analysis = self.mapping_data['analysis']
        deps = self.mapping_data['dependencies']
        
        insights = {
            "code_quality_score": self._calculate_quality_score(stats, analysis, deps),
            "strengths": [],
            "areas_for_improvement": [],
            "technical_debt": [],
            "recommendations": []
        }
        
        # Analyze strengths
        test_ratio = len(analysis['test_files']) / stats['total_files']
        if test_ratio > 0.3:
            insights["strengths"].append("Excellent test coverage")
        
        if len(analysis['documentation']) > stats['total_files'] * 0.1:
            insights["strengths"].append("Well documented codebase")
        
        if len(analysis['api_endpoints']) > 100:
            insights["strengths"].append("Comprehensive API surface")
        
        # Identify areas for improvement
        if deps['circular_deps']:
            insights["areas_for_improvement"].append(f"{len(deps['circular_deps'])} circular dependencies")
            insights["technical_debt"].append("Circular dependency resolution needed")
        
        if len(stats['file_types']) > 15:
            insights["areas_for_improvement"].append("Many file types - consider consolidation")
        
        # Generate recommendations
        if test_ratio < 0.2:
            insights["recommendations"].append("Increase test coverage to at least 20%")
        
        if deps['circular_deps']:
            insights["recommendations"].append("Prioritize resolving circular dependencies")
        
        return insights
    
    def _calculate_quality_score(self, stats: Dict, analysis: Dict, deps: Dict) -> float:
        """Calculate a simple code quality score (0-100)."""
        score = 50  # Base score
        
        # Test coverage bonus
        test_ratio = len(analysis['test_files']) / stats['total_files']
        score += min(test_ratio * 100, 30)  # Max 30 points for tests
        
        # Documentation bonus
        doc_ratio = len(analysis['documentation']) / stats['total_files']
        score += min(doc_ratio * 100, 15)  # Max 15 points for docs
        
        # Circular dependency penalty
        score -= min(len(deps['circular_deps']) * 2, 20)  # Max -20 points
        
        # File organization bonus/penalty
        if len(stats['file_types']) < 10:
            score += 5  # Well organized
        elif len(stats['file_types']) > 20:
            score -= 5  # Too many types
        
        return max(0, min(100, score))


def main():
    """Demo the AI agent helper functionality."""
    print("🤖 AI Agent Helper Demo")
    print("=" * 50)
    
    helper = AIAgentHelper()
    
    # Demo 1: Project context
    print("\n📊 Project Context:")
    context = helper.get_project_context()
    if 'error' not in context:
        print(f"   Files: {context['project_overview']['total_files']}")
        print(f"   Test Coverage: {context['code_quality']['test_coverage_ratio']:.1%}")
        print(f"   API Endpoints: {context['code_quality']['api_endpoints']}")
    
    # Demo 2: Search context
    print("\n🔍 Search Context for 'authentication':")
    search_result = helper.search_for_context("authentication", max_results=3)
    print(f"   Found: {search_result['found_matches']} matches")
    for file_info in search_result['relevant_files'][:2]:
        print(f"   • {file_info['path']} (score: {file_info['relevance_score']:.2f})")
    
    # Demo 3: Development insights
    print("\n💡 Development Insights:")
    insights = helper.get_development_insights()
    if 'error' not in insights:
        print(f"   Quality Score: {insights['code_quality_score']:.0f}/100")
        print(f"   Strengths: {len(insights['strengths'])}")
        print(f"   Areas for Improvement: {len(insights['areas_for_improvement'])}")
    
    # Demo 4: AI prompt context
    print("\n🤖 AI Prompt Context Sample:")
    prompt_context = helper.get_ai_prompt_context("How does user authentication work?")
    print(prompt_context[:300] + "..." if len(prompt_context) > 300 else prompt_context)


if __name__ == '__main__':
    main()
