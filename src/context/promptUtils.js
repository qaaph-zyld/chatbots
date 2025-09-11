const path = require('path');

class PromptUtils {
  static createCodeBlock(language, content) {
    return `\`\`\`${language}\n${content}\n\`\`\``;
  }

  static formatFileContext(file) {
    const extension = path.extname(file.path).substring(1) || 'text';
    return `// File: ${file.path}\n${this.createCodeBlock(extension, file.content)}`;
  }

  static createContextSections(files) {
    if (!files || files.length === 0) return '';
    
    const sections = files.map(file => this.formatFileContext(file));
    return `\n\nWORKSPACE CONTEXT (${files.length} relevant files):\n${sections.join('\n\n')}\n`;
  }

  static createSystemPrompt(workspaceContext) {
    return {
      role: 'system',
      content: `You are an AI coding assistant with access to the project workspace. \
Use the provided context to understand the codebase structure and patterns. \
When referencing code, always include the file path and use code blocks with the correct language.\n\
${workspaceContext ? `Current workspace: ${workspaceContext.workspaceRoot}\n` : ''}\
Follow these guidelines:
1. Reference specific files when making changes
2. Maintain existing code style and patterns
3. Keep changes focused and minimal
4. Include relevant context in your responses`
    };
  }

  static createUserPrompt(userInput, relevantFiles) {
    let prompt = userInput;
    
    if (relevantFiles && relevantFiles.length > 0) {
      prompt += '\n\nRelevant files for context:';
      relevantFiles.forEach(file => {
        prompt += `\n- ${file.path} (${file.content.length} chars)`;
      });
    }
    
    return {
      role: 'user',
      content: prompt
    };
  }

  static createAIMessage(content) {
    return {
      role: 'assistant',
      content: content
    };
  }

  static createFunctionCallPrompt(functionName, args) {
    return {
      role: 'assistant',
      content: null,
      function_call: {
        name: functionName,
        arguments: JSON.stringify(args)
      }
    };
  }

  static createFunctionResponse(functionName, content) {
    return {
      role: 'function',
      name: functionName,
      content: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
    };
  }
}

module.exports = PromptUtils;
