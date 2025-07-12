#!/usr/bin/env python
"""
Sentiment Analysis Bridge

This script provides sentiment analysis capabilities using multiple open-source libraries:
- VADER (Valence Aware Dictionary and sEntiment Reasoner)
- TextBlob
- NLTK

It serves as a bridge between the Node.js application and Python sentiment analysis libraries.
"""

import sys
import json
import os
import traceback
from typing import Dict, Any, List, Optional, Union

# Check if required packages are installed, if not install them
try:
    import nltk
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    from textblob import TextBlob
except ImportError:
    import subprocess
    import sys
    
    # Install required packages
    subprocess.check_call([sys.executable, "-m", "pip", "install", "nltk", "textblob"])
    
    # Import after installation
    import nltk
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    from textblob import TextBlob

# Download required NLTK data if not already downloaded
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

try:
    nltk.data.find('punkt')
except LookupError:
    nltk.download('punkt')

class SentimentAnalyzer:
    """Sentiment analysis using multiple libraries for better accuracy"""
    
    def __init__(self):
        """Initialize sentiment analyzers"""
        self.vader = SentimentIntensityAnalyzer()
        # Add any custom words to the VADER lexicon
        self.vader.lexicon.update({
            'awesome': 4.0,
            'excellent': 3.5,
            'terrible': -3.5,
            'horrible': -3.5,
            'amazing': 3.0,
            'love': 3.0,
            'hate': -3.0
        })
    
    def analyze_with_vader(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment using VADER
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with sentiment scores
        """
        return self.vader.polarity_scores(text)
    
    def analyze_with_textblob(self, text: str) -> Dict[str, float]:
        """
        Analyze sentiment using TextBlob
        
        Args:
            text: Input text to analyze
            
        Returns:
            Dictionary with polarity and subjectivity
        """
        blob = TextBlob(text)
        return {
            'polarity': blob.sentiment.polarity,
            'subjectivity': blob.sentiment.subjectivity
        }
    
    def analyze(self, text: str, method: str = 'combined') -> Dict[str, Any]:
        """
        Analyze sentiment using specified method
        
        Args:
            text: Input text to analyze
            method: Analysis method ('vader', 'textblob', or 'combined')
            
        Returns:
            Dictionary with sentiment analysis results
        """
        result = {
            'text': text,
            'sentiment': {},
            'emotions': {}
        }
        
        # Get VADER sentiment
        vader_scores = self.analyze_with_vader(text)
        
        # Get TextBlob sentiment
        textblob_scores = self.analyze_with_textblob(text)
        
        if method == 'vader':
            result['sentiment'] = {
                'score': vader_scores['compound'],
                'positive': vader_scores['pos'],
                'negative': vader_scores['neg'],
                'neutral': vader_scores['neu'],
                'label': self._get_sentiment_label(vader_scores['compound'])
            }
        elif method == 'textblob':
            result['sentiment'] = {
                'score': textblob_scores['polarity'],
                'subjectivity': textblob_scores['subjectivity'],
                'label': self._get_sentiment_label(textblob_scores['polarity'])
            }
        else:  # combined
            # Combine scores (weighted average)
            combined_score = (vader_scores['compound'] * 0.7) + (textblob_scores['polarity'] * 0.3)
            
            result['sentiment'] = {
                'score': combined_score,
                'label': self._get_sentiment_label(combined_score),
                'vader': {
                    'compound': vader_scores['compound'],
                    'positive': vader_scores['pos'],
                    'negative': vader_scores['neg'],
                    'neutral': vader_scores['neu']
                },
                'textblob': {
                    'polarity': textblob_scores['polarity'],
                    'subjectivity': textblob_scores['subjectivity']
                }
            }
        
        # Extract basic emotions (very simplified approach)
        result['emotions'] = self._extract_emotions(text, vader_scores, textblob_scores)
        
        return result
    
    def _get_sentiment_label(self, score: float) -> str:
        """
        Convert sentiment score to text label
        
        Args:
            score: Sentiment score
            
        Returns:
            Sentiment label
        """
        if score >= 0.5:
            return 'very positive'
        elif score >= 0.1:
            return 'positive'
        elif score > -0.1:
            return 'neutral'
        elif score > -0.5:
            return 'negative'
        else:
            return 'very negative'
    
    def _extract_emotions(self, text: str, vader_scores: Dict[str, float], 
                         textblob_scores: Dict[str, float]) -> Dict[str, float]:
        """
        Extract basic emotions from text
        
        Args:
            text: Input text
            vader_scores: VADER sentiment scores
            textblob_scores: TextBlob sentiment scores
            
        Returns:
            Dictionary with emotion scores
        """
        # Simple emotion detection based on keywords and sentiment scores
        emotions = {
            'joy': 0.0,
            'sadness': 0.0,
            'anger': 0.0,
            'fear': 0.0,
            'surprise': 0.0
        }
        
        # Convert text to lowercase for easier matching
        text_lower = text.lower()
        
        # Joy indicators
        joy_words = ['happy', 'joy', 'delighted', 'glad', 'pleased', 'excited', 'love', 'wonderful']
        for word in joy_words:
            if word in text_lower:
                emotions['joy'] += 0.2
        
        # Sadness indicators
        sad_words = ['sad', 'unhappy', 'depressed', 'miserable', 'disappointed', 'sorry', 'upset']
        for word in sad_words:
            if word in text_lower:
                emotions['sadness'] += 0.2
        
        # Anger indicators
        anger_words = ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'hate', 'frustrat']
        for word in anger_words:
            if word in text_lower:
                emotions['anger'] += 0.2
        
        # Fear indicators
        fear_words = ['afraid', 'scared', 'frightened', 'terrified', 'anxious', 'worried', 'nervous']
        for word in fear_words:
            if word in text_lower:
                emotions['fear'] += 0.2
        
        # Surprise indicators
        surprise_words = ['surprised', 'amazed', 'astonished', 'shocked', 'wow', 'unexpected']
        for word in surprise_words:
            if word in text_lower:
                emotions['surprise'] += 0.2
        
        # Adjust based on sentiment scores
        if vader_scores['compound'] > 0.5:
            emotions['joy'] += 0.3
        elif vader_scores['compound'] < -0.5:
            emotions['sadness'] += 0.2
            emotions['anger'] += 0.1
        
        # Cap emotion values at 1.0
        for emotion in emotions:
            emotions[emotion] = min(emotions[emotion], 1.0)
        
        return emotions

def process_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a sentiment analysis request
    
    Args:
        request_data: Request data containing text and options
        
    Returns:
        Analysis results
    """
    try:
        # Extract request parameters
        text = request_data.get('text', '')
        method = request_data.get('method', 'combined')
        
        if not text:
            return {'error': 'No text provided for analysis'}
        
        # Perform sentiment analysis
        analyzer = SentimentAnalyzer()
        result = analyzer.analyze(text, method)
        
        return result
    except Exception as e:
        return {
            'error': str(e),
            'traceback': traceback.format_exc()
        }

def main():
    """Main entry point for the script"""
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        request = json.loads(input_data)
        
        # Process the request
        result = process_request(request)
        
        # Write result to stdout
        sys.stdout.write(json.dumps(result))
    except Exception as e:
        # Handle any unexpected errors
        error_result = {
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        sys.stdout.write(json.dumps(error_result))

if __name__ == '__main__':
    main()
