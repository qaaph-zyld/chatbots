# Weather Integration Plugin

## Overview
The Weather Integration plugin adds weather information to chatbot responses when weather-related queries are detected. It uses an external weather API to fetch current weather data for specified locations.

## Features
- Detects weather-related queries in user messages
- Extracts location information from queries
- Fetches real-time weather data from external API
- Caches weather data to reduce API calls
- Formats weather information in human-readable responses

## Configuration Options
| Option | Type | Description | Required | Default |
|--------|------|-------------|----------|---------|
| apiKey | string | API key for weather service | Yes | - |
| defaultLocation | string | Default location to use when no location is specified | No | New York |
| units | string | Units for temperature (metric, imperial) | No | metric |
| cacheTimeMinutes | number | Time in minutes to cache weather data | No | 30 |

## Hooks
The plugin implements the following hooks:

### preProcessMessage
Detects weather-related queries and extracts location information from the message.

### postProcessResponse
Fetches weather data and adds it to the chatbot response when a weather query is detected.

## Installation
1. Install the plugin using the Plugin Management interface
2. Configure the plugin with your weather API key and preferred settings
3. Enable the plugin for your chatbot

## Example Usage
Once installed and enabled, the plugin will automatically detect weather-related queries:

User: "What's the weather like in London?"
*Plugin detects weather query for London*
Chatbot: "Current weather in London, GB: partly cloudy, 18°C (feels like 17°C). Humidity: 65%, Wind: 12 m/s."

User: "Will it rain today?"
*Plugin uses default location*
Chatbot: "Current weather in New York, US: light rain, 22°C (feels like 24°C). Humidity: 80%, Wind: 5 m/s."

## Dependencies
- axios (for API calls)
