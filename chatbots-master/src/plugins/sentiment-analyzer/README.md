# Sentiment Analyzer Plugin

## Overview
The Sentiment Analyzer plugin analyzes the sentiment of user messages and adds sentiment data to the message context. This allows the chatbot to respond appropriately based on the detected sentiment.

## Features
- Analyzes message sentiment (positive, negative, neutral)
- Provides sentiment score and confidence level
- Supports both local analysis and external API integration
- Modifies chatbot responses based on detected sentiment
- Configurable confidence threshold

## Configuration Options
| Option | Type | Description | Required | Default |
|--------|------|-------------|----------|---------|
| apiKey | string | API key for external sentiment analysis service | No | - |
| useLocalAnalysis | boolean | Whether to use local sentiment analysis instead of external API | No | true |
| confidenceThreshold | number | Minimum confidence threshold for sentiment detection (0-1) | No | 0.6 |

## Hooks
The plugin implements the following hooks:

### preProcessMessage
Analyzes the sentiment of incoming messages and adds sentiment data to the message context.

### postProcessResponse
Modifies outgoing responses based on detected sentiment, adding empathetic prefacing for highly negative sentiment.

## Installation
1. Install the plugin using the Plugin Management interface
2. Configure the plugin with your preferred settings
3. Enable the plugin for your chatbot

## Example Usage
Once installed and enabled, the plugin will automatically analyze the sentiment of all incoming messages. For example:

User: "I'm really frustrated with this product, it doesn't work at all!"
*Plugin detects negative sentiment with high confidence*
Chatbot: "I understand you might be feeling frustrated. Let me help you resolve this issue..."

## Dependencies
- axios (for external API calls)
