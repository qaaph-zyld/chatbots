#!/usr/bin/env python3
"""
Semantic Search Module for Workspace Mapper
==========================================

Provides semantic search capabilities using vector embeddings and FAISS
for intelligent code search and relationship discovery.

Author: Workspace Analysis Framework
Version: 1.0.0
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import time

# Optional imports for AI functionality
try:
    from langchain.embeddings import OpenAIEmbeddings
    from langchain.vectorstores import FAISS
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain.document_loaders import DirectoryLoader, TextLoader
    from langchain.schema import Document
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False
    # Create a dummy Document class for type hints when langchain is not available
    class Document:
        def __init__(self, page_content: str, metadata: Dict[str, Any] = None):
            self.page_content = page_content
            self.metadata = metadata or {}
    print("Warning: langchain not available. Semantic search will be disabled.")

try:
    import tiktoken
    HAS_TIKTOKEN = True
except ImportError:
    HAS_TIKTOKEN = False
    print("Warning: tiktoken not available. Token counting will be approximate.")


@dataclass
class SearchResult:
    """Represents a search result with metadata."""
    file_path: str
    content: str
    score: float
    start_line: int
    end_line: int
    context: Dict[str, Any]


class SemanticSearchEngine:
    """
    Semantic search engine for workspace code and documentation.
    """
    
    def __init__(self, workspace_path: str, config: Optional[Dict] = None):
        """Initialize the semantic search engine."""
        self.workspace_path = Path(workspace_path)
        self.config = {
            'chunk_size': 1000,
            'chunk_overlap': 200,
            'max_tokens_per_chunk': 8000,
            'include_extensions': {'.js', '.jsx', '.ts', '.tsx', '.py', '.md', '.json', '.yml', '.yaml'},
            'exclude_patterns': {'node_modules', '.git', '__pycache__', 'dist', 'build'},
            'embedding_model': 'text-embedding-ada-002',
            'max_results': 10
        }
        
        if config:
            self.config.update(config)
            
        self.logger = logging.getLogger(__name__)
        self.vectorstore = None
        self.embeddings = None
        self.documents = []
        
        # Initialize components if available
        if HAS_LANGCHAIN:
            try:
                self.embeddings = OpenAIEmbeddings(model=self.config['embedding_model'])
            except Exception as e:
                self.logger.warning(f"Failed to initialize OpenAI embeddings: {e}")
                
    def load_documents(self) -> List[Document]:
        """Load and process documents from the workspace."""
        if not HAS_LANGCHAIN:
            self.logger.error("Langchain not available. Cannot load documents.")
            return []
            
        self.logger.info("Loading documents from workspace...")
        
        documents = []
        
        # Walk through the workspace directory
        for root, dirs, files in os.walk(self.workspace_path):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if not any(pattern in d for pattern in self.config['exclude_patterns'])]
            
            for file in files:
                file_path = Path(root) / file
                
                # Check if file should be included
                if self._should_include_file(file_path):
                    try:
                        content = self._read_file_safely(file_path)
                        if content:
                            # Create document with metadata
                            relative_path = str(file_path.relative_to(self.workspace_path))
                            doc = Document(
                                page_content=content,
                                metadata={
                                    'source': relative_path,
                                    'file_type': file_path.suffix,
                                    'file_size': file_path.stat().st_size,
                                    'modified': file_path.stat().st_mtime
                                }
                            )
                            documents.append(doc)
                    except Exception as e:
                        self.logger.warning(f"Failed to load file {file_path}: {e}")
                        
        self.logger.info(f"Loaded {len(documents)} documents")
        self.documents = documents
        return documents
        
    def _should_include_file(self, file_path: Path) -> bool:
        """Check if a file should be included in the search index."""
        # Check extension
        if file_path.suffix not in self.config['include_extensions']:
            return False
            
        # Check size (skip very large files)
        try:
            if file_path.stat().st_size > 10 * 1024 * 1024:  # 10MB
                return False
        except OSError:
            return False
            
        # Check for binary content
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(1024)
                if b'\x00' in chunk:
                    return False
        except (OSError, IOError):
            return False
            
        return True
        
    def _read_file_safely(self, file_path: Path) -> Optional[str]:
        """Safely read file content with encoding detection."""
        encodings = ['utf-8', 'utf-8-sig', 'latin1', 'cp1252']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except (UnicodeDecodeError, UnicodeError):
                continue
            except (OSError, IOError):
                return None
                
        return None
        
    def create_index(self, output_dir: str = "vector_index") -> bool:
        """Create and save the vector index."""
        if not HAS_LANGCHAIN or not self.embeddings:
            self.logger.error("Cannot create index: langchain or embeddings not available")
            return False
            
        self.logger.info("Creating vector index...")
        start_time = time.time()
        
        # Load documents if not already loaded
        if not self.documents:
            self.load_documents()
            
        if not self.documents:
            self.logger.error("No documents loaded")
            return False
            
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config['chunk_size'],
            chunk_overlap=self.config['chunk_overlap'],
            separators=["\n\n", "\n", " ", ""]
        )
        
        splits = text_splitter.split_documents(self.documents)
        self.logger.info(f"Split into {len(splits)} chunks")
        
        # Create vector store
        try:
            self.vectorstore = FAISS.from_documents(splits, self.embeddings)
            
            # Save the index
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
            self.vectorstore.save_local(str(output_path))
            
            # Save metadata
            metadata = {
                'created': time.time(),
                'num_documents': len(self.documents),
                'num_chunks': len(splits),
                'config': self.config
            }
            
            with open(output_path / 'metadata.json', 'w') as f:
                json.dump(metadata, f, indent=2)
                
            processing_time = time.time() - start_time
            self.logger.info(f"Vector index created in {processing_time:.2f} seconds")
            self.logger.info(f"Index saved to: {output_path}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to create vector index: {e}")
            return False
            
    def load_index(self, index_dir: str = "vector_index") -> bool:
        """Load an existing vector index."""
        if not HAS_LANGCHAIN or not self.embeddings:
            self.logger.error("Cannot load index: langchain or embeddings not available")
            return False
            
        index_path = Path(index_dir)
        if not index_path.exists():
            self.logger.error(f"Index directory does not exist: {index_path}")
            return False
            
        try:
            self.vectorstore = FAISS.load_local(str(index_path), self.embeddings)
            self.logger.info(f"Vector index loaded from: {index_path}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to load vector index: {e}")
            return False
            
    def search(self, query: str, k: int = None) -> List[SearchResult]:
        """Perform semantic search and return results."""
        if not self.vectorstore:
            self.logger.error("Vector store not available. Create or load an index first.")
            return []
            
        if k is None:
            k = self.config['max_results']
            
        try:
            # Perform similarity search with scores
            docs_with_scores = self.vectorstore.similarity_search_with_score(query, k=k)
            
            results = []
            for doc, score in docs_with_scores:
                # Extract line information (approximate)
                lines = doc.page_content.split('\n')
                start_line = 1  # This would need more sophisticated tracking
                end_line = start_line + len(lines) - 1
                
                result = SearchResult(
                    file_path=doc.metadata['source'],
                    content=doc.page_content,
                    score=score,
                    start_line=start_line,
                    end_line=end_line,
                    context=doc.metadata
                )
                results.append(result)
                
            return results
            
        except Exception as e:
            self.logger.error(f"Search failed: {e}")
            return []
            
    def search_by_file_type(self, query: str, file_type: str, k: int = None) -> List[SearchResult]:
        """Search within specific file types."""
        if not self.vectorstore:
            return []
            
        # This would require a more sophisticated filtering mechanism
        # For now, we'll do post-filtering
        all_results = self.search(query, k=k*2 if k else 20)
        
        filtered_results = [
            result for result in all_results 
            if result.context.get('file_type', '').lower() == file_type.lower()
        ]
        
        return filtered_results[:k] if k else filtered_results
        
    def find_similar_files(self, file_path: str, k: int = 5) -> List[SearchResult]:
        """Find files similar to the given file."""
        if not self.vectorstore:
            return []
            
        # Read the target file
        target_file = self.workspace_path / file_path
        if not target_file.exists():
            self.logger.error(f"Target file does not exist: {target_file}")
            return []
            
        content = self._read_file_safely(target_file)
        if not content:
            return []
            
        # Use the file content as the search query
        # Take a representative sample if the file is too long
        if len(content) > 2000:
            content = content[:1000] + content[-1000:]
            
        return self.search(content, k=k)
        
    def get_code_context(self, file_path: str, line_number: int, context_lines: int = 5) -> Optional[str]:
        """Get code context around a specific line."""
        target_file = self.workspace_path / file_path
        if not target_file.exists():
            return None
            
        content = self._read_file_safely(target_file)
        if not content:
            return None
            
        lines = content.split('\n')
        start_line = max(0, line_number - context_lines - 1)
        end_line = min(len(lines), line_number + context_lines)
        
        context_lines_list = lines[start_line:end_line]
        
        # Add line numbers
        numbered_lines = []
        for i, line in enumerate(context_lines_list, start=start_line + 1):
            marker = ">>>" if i == line_number else "   "
            numbered_lines.append(f"{marker} {i:4d}: {line}")
            
        return '\n'.join(numbered_lines)
        
    def analyze_query_intent(self, query: str) -> Dict[str, Any]:
        """Analyze the search query to understand intent."""
        intent = {
            'type': 'general',
            'entities': [],
            'file_types': [],
            'concepts': []
        }
        
        # Simple keyword-based intent detection
        query_lower = query.lower()
        
        # File type detection
        file_type_keywords = {
            'javascript': ['.js', 'javascript', 'js', 'node'],
            'typescript': ['.ts', 'typescript', 'ts'],
            'python': ['.py', 'python', 'py'],
            'json': ['.json', 'json', 'config'],
            'markdown': ['.md', 'markdown', 'documentation', 'readme']
        }
        
        for file_type, keywords in file_type_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                intent['file_types'].append(file_type)
                
        # Concept detection
        concept_keywords = {
            'authentication': ['auth', 'login', 'password', 'token', 'session'],
            'database': ['db', 'database', 'model', 'schema', 'query'],
            'api': ['api', 'endpoint', 'route', 'controller', 'request'],
            'testing': ['test', 'spec', 'mock', 'jest', 'unit'],
            'configuration': ['config', 'settings', 'environment', 'env']
        }
        
        for concept, keywords in concept_keywords.items():
            if any(keyword in query_lower for keyword in keywords):
                intent['concepts'].append(concept)
                
        # Intent type classification
        if any(word in query_lower for word in ['how', 'what', 'why', 'explain']):
            intent['type'] = 'explanation'
        elif any(word in query_lower for word in ['find', 'search', 'locate', 'where']):
            intent['type'] = 'search'
        elif any(word in query_lower for word in ['similar', 'like', 'related']):
            intent['type'] = 'similarity'
            
        return intent
        
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about the search index."""
        if not self.vectorstore:
            return {}
            
        stats = {
            'total_documents': len(self.documents),
            'index_size': 0,  # Would need to calculate actual size
            'file_types': {},
            'largest_files': []
        }
        
        # Analyze document metadata
        for doc in self.documents:
            file_type = doc.metadata.get('file_type', 'unknown')
            stats['file_types'][file_type] = stats['file_types'].get(file_type, 0) + 1
            
        return stats


class WorkspaceQuery:
    """
    High-level query interface that combines workspace mapping with semantic search.
    """
    
    def __init__(self, workspace_path: str, mapping_path: Optional[str] = None, 
                 index_path: Optional[str] = None):
        """Initialize the query interface."""
        self.workspace_path = Path(workspace_path)
        self.mapping = {}
        self.search_engine = None
        
        # Load workspace mapping if provided
        if mapping_path and Path(mapping_path).exists():
            with open(mapping_path, 'r') as f:
                self.mapping = json.load(f)
                
        # Initialize search engine if index exists
        if index_path and Path(index_path).exists():
            self.search_engine = SemanticSearchEngine(workspace_path)
            if not self.search_engine.load_index(index_path):
                self.search_engine = None
                
        self.logger = logging.getLogger(__name__)
        
    def query(self, question: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Answer a question about the workspace."""
        result = {
            'question': question,
            'answer': '',
            'sources': [],
            'suggestions': [],
            'confidence': 0.0
        }
        
        if not self.search_engine:
            result['answer'] = "Semantic search not available. Please create an index first."
            return result
            
        # Analyze query intent
        intent = self.search_engine.analyze_query_intent(question)
        
        # Perform search based on intent
        if intent['type'] == 'similarity':
            # Extract file path if mentioned
            # This is simplified - would need better NLP
            search_results = self.search_engine.search(question)
        else:
            search_results = self.search_engine.search(question)
            
        # Process results
        if search_results:
            result['sources'] = [
                {
                    'file': r.file_path,
                    'content': r.content[:500] + '...' if len(r.content) > 500 else r.content,
                    'score': r.score,
                    'lines': f"{r.start_line}-{r.end_line}"
                }
                for r in search_results[:5]
            ]
            
            # Generate answer based on results
            result['answer'] = self._generate_answer(question, search_results, intent)
            result['confidence'] = min(search_results[0].score, 1.0) if search_results else 0.0
            
        # Add suggestions
        result['suggestions'] = self._generate_suggestions(question, intent)
        
        return result
        
    def _generate_answer(self, question: str, results: List[SearchResult], 
                        intent: Dict[str, Any]) -> str:
        """Generate an answer based on search results."""
        if not results:
            return "No relevant information found in the workspace."
            
        # Simple answer generation based on intent
        if intent['type'] == 'explanation':
            return f"Based on the codebase analysis, here are the relevant files and code sections that relate to your question:\n\n" + \
                   f"Most relevant: {results[0].file_path}\n" + \
                   f"This file contains relevant code that may help answer your question."
        elif intent['type'] == 'search':
            files = [r.file_path for r in results[:3]]
            return f"Found relevant information in these files: {', '.join(files)}"
        else:
            return f"Found {len(results)} relevant code sections. The most relevant is in {results[0].file_path}."
            
    def _generate_suggestions(self, question: str, intent: Dict[str, Any]) -> List[str]:
        """Generate helpful suggestions."""
        suggestions = []
        
        if intent['concepts']:
            for concept in intent['concepts']:
                suggestions.append(f"Search for more {concept}-related code")
                
        if intent['file_types']:
            for file_type in intent['file_types']:
                suggestions.append(f"Filter results by {file_type} files")
                
        suggestions.extend([
            "Try a more specific search query",
            "Look for related files using similarity search",
            "Check the workspace mapping for file relationships"
        ])
        
        return suggestions[:3]


if __name__ == '__main__':
    # Simple test
    import sys
    
    if len(sys.argv) > 1:
        workspace_path = sys.argv[1]
    else:
        workspace_path = '.'
        
    # Create and test search engine
    engine = SemanticSearchEngine(workspace_path)
    
    if HAS_LANGCHAIN:
        print("Creating search index...")
        if engine.create_index():
            print("Index created successfully!")
            
            # Test search
            results = engine.search("authentication login")
            print(f"\nFound {len(results)} results for 'authentication login':")
            for i, result in enumerate(results[:3], 1):
                print(f"{i}. {result.file_path} (score: {result.score:.3f})")
        else:
            print("Failed to create index")
    else:
        print("Langchain not available - semantic search disabled")
