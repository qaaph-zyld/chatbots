#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Entity Recognition Python Bridge

This script provides a bridge between the Node.js application and Python-based
entity recognition models. It handles loading models, extracting entities from text,
and communicating results back to the Node.js application.

Supported models:
- Hugging Face Transformers (DistilBERT, BERT, RoBERTa)
- spaCy (via separate bridge)
"""

import os
import sys
import json
import logging
from typing import Dict, List, Any, Optional, Union
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger("entity_recognition")

# Global variables
models = {}
model_configs = {}

def setup_environment():
    """Set up the Python environment for entity recognition."""
    try:
        # Check if transformers is available
        import transformers
        logger.info(f"Transformers version: {transformers.__version__}")
        
        # Check if torch is available
        import torch
        logger.info(f"PyTorch version: {torch.__version__}")
        logger.info(f"CUDA available: {torch.cuda.is_available()}")
        
        return True
    except ImportError as e:
        logger.error(f"Environment setup failed: {str(e)}")
        return False

def load_model(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Load a model for entity recognition.
    
    Args:
        params: Dictionary containing parameters:
            - model_name: Name of the model to load
            
    Returns:
        Dictionary with results:
            - success: Boolean indicating if the model was loaded successfully
            - error: Error message if loading failed
            - supported_entities: List of entity types supported by the model
    """
    model_name = params.get("model_name")
    
    if not model_name:
        return {"success": False, "error": "Model name not provided"}
    
    try:
        # Check if model is already loaded
        if model_name in models:
            return {
                "success": True,
                "message": f"Model {model_name} already loaded",
                "supported_entities": model_configs[model_name].get("supported_entities", [])
            }
        
        # Import required libraries
        from transformers import AutoTokenizer, AutoModelForTokenClassification, pipeline
        
        # Load tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForTokenClassification.from_pretrained(model_name)
        
        # Create NER pipeline
        ner_pipeline = pipeline(
            "ner",
            model=model,
            tokenizer=tokenizer,
            aggregation_strategy="simple"  # Merge tokens with the same entity
        )
        
        # Store model and configuration
        models[model_name] = ner_pipeline
        
        # Get supported entity types
        # This is a bit of a hack, but we need to run the pipeline on a sample text
        # to get the entity types it supports
        sample_text = "John Smith works at Microsoft in Seattle and earned $5000 on January 1st, 2023."
        sample_results = ner_pipeline(sample_text)
        supported_entities = list(set(entity["entity_group"] for entity in sample_results))
        
        model_configs[model_name] = {
            "supported_entities": supported_entities
        }
        
        logger.info(f"Loaded model {model_name} with entities: {supported_entities}")
        
        return {
            "success": True,
            "message": f"Model {model_name} loaded successfully",
            "supported_entities": supported_entities
        }
    except Exception as e:
        error_message = f"Failed to load model {model_name}: {str(e)}"
        logger.error(error_message)
        logger.error(traceback.format_exc())
        return {"success": False, "error": error_message}

def extract_entities(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract entities from text using a specified model.
    
    Args:
        params: Dictionary containing parameters:
            - text: Text to extract entities from
            - model_name: Name of the model to use
            - confidence_threshold: Minimum confidence score for entities
            
    Returns:
        Dictionary with results:
            - success: Boolean indicating if extraction was successful
            - error: Error message if extraction failed
            - entities: List of extracted entities
    """
    text = params.get("text")
    model_name = params.get("model_name")
    confidence_threshold = params.get("confidence_threshold", 0.7)
    
    if not text:
        return {"success": False, "error": "Text not provided"}
    
    if not model_name:
        return {"success": False, "error": "Model name not provided"}
    
    if model_name not in models:
        return {"success": False, "error": f"Model {model_name} not loaded"}
    
    try:
        # Get the NER pipeline
        ner_pipeline = models[model_name]
        
        # Extract entities
        results = ner_pipeline(text)
        
        # Format entities
        entities = []
        for entity in results:
            if entity["score"] >= confidence_threshold:
                entities.append({
                    "text": entity["word"],
                    "type": entity["entity_group"],
                    "start": entity["start"],
                    "end": entity["end"],
                    "confidence": entity["score"],
                    "source": model_name
                })
        
        return {
            "success": True,
            "entities": entities
        }
    except Exception as e:
        error_message = f"Entity extraction failed: {str(e)}"
        logger.error(error_message)
        logger.error(traceback.format_exc())
        return {"success": False, "error": error_message}

def process_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a request from the Node.js application.
    
    Args:
        request_data: Dictionary containing request data:
            - command: Command to execute
            - params: Parameters for the command
            - request_id: Unique identifier for the request
            
    Returns:
        Dictionary with response data
    """
    command = request_data.get("command")
    params = request_data.get("params", {})
    request_id = request_data.get("request_id")
    
    response = {
        "request_id": request_id,
        "success": False,
        "error": "Unknown command"
    }
    
    if command == "load_model":
        response = load_model(params)
    elif command == "extract_entities":
        response = extract_entities(params)
    elif command == "setup":
        response = {"success": setup_environment()}
    
    response["request_id"] = request_id
    return response

def main():
    """Main entry point for the script."""
    # Set up environment
    setup_environment()
    
    try:
        # Read request data from stdin
        request_data = json.loads(sys.stdin.read())
        
        # Process request
        response = process_request(request_data)
        
        # Write response to stdout
        sys.stdout.write(json.dumps(response))
        sys.stdout.flush()
    except Exception as e:
        error_message = f"Error processing request: {str(e)}"
        logger.error(error_message)
        logger.error(traceback.format_exc())
        
        # Write error response to stdout
        error_response = {
            "success": False,
            "error": error_message,
            "request_id": request_data.get("request_id") if 'request_data' in locals() else None
        }
        sys.stdout.write(json.dumps(error_response))
        sys.stdout.flush()

if __name__ == "__main__":
    main()
