# Translator Plugin

## Overview
The Translator plugin enables multilingual capabilities for chatbots by translating messages between languages using open-source translation libraries. It supports both explicit translation requests and automatic translation of messages.

## Features
- Translates messages between multiple languages
- Detects translation commands in user messages
- Supports automatic language detection
- Provides auto-translation for incoming messages
- Uses open-source translation services (LibreTranslate)

## Configuration Options
| Option | Type | Description | Required | Default |
|--------|------|-------------|----------|---------|
| defaultSourceLanguage | string | Default source language code (ISO 639-1) | No | auto |
| defaultTargetLanguage | string | Default target language code (ISO 639-1) | No | en |
| translationEndpoint | string | URL for the translation service | No | https://libretranslate.com/translate |
| apiKey | string | API key for translation service (if required) | No | - |
| autoDetectLanguage | boolean | Whether to automatically detect the source language | No | true |

## Supported Languages
The plugin supports translation between the following languages:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Arabic (ar)
- Hindi (hi)

## Hooks
The plugin implements the following hooks:

### preProcessMessage
Detects translation requests in user messages and extracts the source language, target language, and text to translate.

### postProcessResponse
Translates responses when a translation request is detected.

### onMessage
Automatically translates incoming messages if auto-translation is enabled for the chatbot or user.

## Installation
1. Install the plugin using the Plugin Management interface
2. Configure the plugin with your preferred settings
3. Enable the plugin for your chatbot

## Example Usage
Once installed and enabled, the plugin responds to translation commands:

User: "Translate to Spanish: Hello, how are you?"
Chatbot: "Hola, ¿cómo estás?"

User: "Say in French: I would like to order a coffee"
Chatbot: "Je voudrais commander un café"

User: "Translate from English to German: The weather is nice today"
Chatbot: "Das Wetter ist heute schön"

## Dependencies
- axios (for API calls)
