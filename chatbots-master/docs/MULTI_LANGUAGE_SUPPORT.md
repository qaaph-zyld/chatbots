# Multi-Language Support

This document provides information about the multi-language support features in the Chatbot Platform.

## Overview

The Chatbot Platform supports multiple languages, allowing you to create chatbots that can communicate with users in their preferred language. The platform includes the following multi-language features:

- Internationalization (i18n) framework for UI translation
- Automatic language detection
- Translation management system
- Support for right-to-left (RTL) languages
- Multi-language knowledge bases

## Supported Languages

The platform currently supports the following languages:

| Language | Code | Direction |
|----------|------|-----------|
| English | en | LTR |
| Spanish | es | LTR |
| French | fr | LTR |
| German | de | LTR |
| Italian | it | LTR |
| Portuguese | pt | LTR |
| Russian | ru | LTR |
| Chinese | zh | LTR |
| Japanese | ja | LTR |
| Korean | ko | LTR |
| Arabic | ar | RTL |
| Hebrew | he | RTL |
| Persian | fa | RTL |
| Urdu | ur | RTL |
| Hindi | hi | LTR |

Additional languages can be added as needed.

## User Interface Translation

The platform's user interface is fully translatable. All text strings are stored in translation files located in the `public/locales` directory. Each language has its own directory containing translation files.

### Translation Files

Translation files are organized as follows:

```
public/locales/
  ├── en/               # English translations
  │   └── translation.json
  ├── es/               # Spanish translations
  │   └── translation.json
  ├── fr/               # French translations
  │   └── translation.json
  └── ar/               # Arabic translations (RTL)
      └── translation.json
```

### Adding a New Language

To add a new language:

1. Create a new directory in `public/locales` with the language code (e.g., `public/locales/de` for German)
2. Create a `translation.json` file in the new directory
3. Copy the content from the English translation file and translate all values
4. Add the language to the supported languages list in the translation service

### Language Selection

Users can change the language using the language selector component in the application header. The selected language is stored in the browser's localStorage and will be remembered for future sessions.

## Language Detection

The platform automatically detects the user's preferred language based on the following sources (in order of priority):

1. URL query parameter (`?lng=es` for Spanish)
2. User's saved preference in localStorage
3. Browser's language setting
4. Default language (English)

## Translation Management

The platform includes a translation management system that allows administrators to:

- View and edit translations for all supported languages
- Add new languages
- Export and import translations
- Track missing translations

### Translation API

The platform provides a REST API for managing translations:

- `GET /api/translations/languages/supported` - Get all supported languages
- `GET /api/translations/languages/available` - Get languages with translation files
- `GET /api/translations/:langCode/:namespace?` - Get translations for a language
- `PUT /api/translations/:langCode/:namespace?` - Update translations for a language
- `POST /api/translations/languages` - Add a new language
- `DELETE /api/translations/languages/:langCode` - Remove a language

## Right-to-Left (RTL) Support

The platform fully supports right-to-left languages such as Arabic, Hebrew, Persian, and Urdu. When a user selects an RTL language, the entire user interface will automatically switch to RTL mode.

### RTL Styling

RTL-specific styles are defined in `src/client/styles/rtl-support.css`. These styles are automatically applied when an RTL language is selected.

### RTL Implementation

The platform uses the following techniques to support RTL languages:

- Setting the `dir="rtl"` attribute on the HTML element
- Using CSS logical properties where possible (e.g., `margin-inline-start` instead of `margin-left`)
- Using the `[dir="rtl"]` CSS selector to override specific styles for RTL languages
- Flipping icons and directional elements

## Multi-Language Knowledge Bases

The platform supports creating and managing knowledge bases in multiple languages.

### Features

- Create knowledge bases in any supported language
- Translate knowledge bases to other languages
- Search across multi-language knowledge bases
- Automatically serve content in the user's preferred language

### Knowledge Base API

The platform provides a REST API for managing multi-language knowledge bases:

- `GET /api/multilingual-kb/:kbId` - Get a knowledge base in a specific language
- `PUT /api/multilingual-kb/:kbId/:langCode` - Save a knowledge base in a specific language
- `GET /api/multilingual-kb/:kbId/languages` - Get available languages for a knowledge base
- `DELETE /api/multilingual-kb/:kbId/:langCode` - Delete a language-specific knowledge base
- `POST /api/multilingual-kb/:kbId/translate` - Translate a knowledge base to multiple languages
- `POST /api/multilingual-kb/search` - Search across multi-language knowledge bases

## Best Practices

### Translation Keys

- Use hierarchical keys for better organization (e.g., `app.name`, `error.notFound`)
- Keep keys consistent across all languages
- Use singular form for keys and handle pluralization with i18next
- Document the context for translators

### Pluralization

The platform supports pluralization using i18next. For example:

```json
{
  "item": "{{count}} item",
  "item_plural": "{{count}} items"
}
```

### Formatting

The platform supports formatting dates, numbers, and currencies according to the selected language's locale.

### RTL Considerations

- Test your chatbot UI in both LTR and RTL modes
- Ensure all icons and directional elements are properly flipped in RTL mode
- Pay attention to text alignment, margins, and paddings

## Implementation Details

The multi-language support is implemented using the following technologies:

- **i18next**: Core internationalization framework
- **react-i18next**: React bindings for i18next
- **i18next-http-backend**: Backend for loading translations
- **i18next-browser-languagedetector**: Language detection plugin

## Troubleshooting

### Missing Translations

If a translation is missing for a specific language, the platform will fall back to English. Missing translations are logged in the console in development mode.

### RTL Layout Issues

If you encounter layout issues in RTL mode, check the following:

1. Ensure the `dir="rtl"` attribute is set on the HTML element
2. Check if the element has explicit `left` or `right` CSS properties
3. Use CSS logical properties where possible
4. Add specific RTL overrides in `rtl-support.css`

## Contributing Translations

We welcome contributions to improve and expand our language support. To contribute translations:

1. Fork the repository
2. Add or update translation files
3. Submit a pull request with your changes

Please ensure that your translations are accurate and consistent with existing translations.
