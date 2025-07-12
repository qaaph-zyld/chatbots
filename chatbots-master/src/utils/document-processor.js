/**
 * Document Processor Utility
 * 
 * Handles parsing and processing of various document types for knowledge base integration
 * Extracts text content, chunks large documents, and prepares them for vector embedding
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { JSDOM } = require('jsdom');
const marked = require('marked');
const logger = require('./logger');

/**
 * Process a document file and extract its content
 * @param {string} filePath - Path to the document file
 * @returns {Promise<Object>} Document title, content, and chunks if applicable
 */
async function processDocument(filePath) {
  try {
    const fileExt = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, fileExt);
    
    let title = fileName;
    let content = '';
    
    // Process based on file type
    switch (fileExt) {
      case '.pdf':
        const pdfResult = await processPdf(filePath);
        title = pdfResult.title || fileName;
        content = pdfResult.content;
        break;
        
      case '.docx':
      case '.doc':
        const docResult = await processWord(filePath);
        title = docResult.title || fileName;
        content = docResult.content;
        break;
        
      case '.txt':
        content = await fs.promises.readFile(filePath, 'utf8');
        break;
        
      case '.md':
        const mdContent = await fs.promises.readFile(filePath, 'utf8');
        content = processMarkdown(mdContent);
        break;
        
      case '.html':
      case '.htm':
        const htmlContent = await fs.promises.readFile(filePath, 'utf8');
        const htmlResult = processHtml(htmlContent);
        title = htmlResult.title || fileName;
        content = htmlResult.content;
        break;
        
      default:
        throw new Error(`Unsupported file type: ${fileExt}`);
    }
    
    // Clean and normalize content
    content = normalizeContent(content);
    
    // Chunk content if it's too large
    const chunks = chunkContent(content);
    
    return {
      title,
      content,
      chunks: chunks.length > 1 ? chunks : null
    };
  } catch (error) {
    logger.error(`Error processing document: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Process PDF document
 * @private
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<Object>} Document title and content
 */
async function processPdf(filePath) {
  try {
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    // Try to extract title from PDF metadata
    let title = '';
    if (data.metadata && data.metadata.Title) {
      title = data.metadata.Title;
    }
    
    return {
      title,
      content: data.text
    };
  } catch (error) {
    logger.error(`Error processing PDF: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Process Word document
 * @private
 * @param {string} filePath - Path to Word file
 * @returns {Promise<Object>} Document title and content
 */
async function processWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const content = result.value;
    
    // Try to extract title from first line
    let title = '';
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      title = lines[0].trim();
    }
    
    return {
      title,
      content
    };
  } catch (error) {
    logger.error(`Error processing Word document: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Process HTML content
 * @private
 * @param {string} htmlContent - HTML content
 * @returns {Object} Document title and content
 */
function processHtml(htmlContent) {
  try {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Extract title
    let title = '';
    const titleElement = document.querySelector('title');
    if (titleElement) {
      title = titleElement.textContent.trim();
    }
    
    // Extract content from body
    const body = document.querySelector('body');
    let content = body ? body.textContent : '';
    
    return {
      title,
      content
    };
  } catch (error) {
    logger.error(`Error processing HTML: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Process Markdown content
 * @private
 * @param {string} mdContent - Markdown content
 * @returns {string} Processed text content
 */
function processMarkdown(mdContent) {
  try {
    // Convert markdown to HTML
    const html = marked.parse(mdContent);
    
    // Extract text from HTML
    const dom = new JSDOM(html);
    const text = dom.window.document.body.textContent;
    
    return text;
  } catch (error) {
    logger.error(`Error processing Markdown: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Normalize and clean text content
 * @private
 * @param {string} content - Raw text content
 * @returns {string} Normalized content
 */
function normalizeContent(content) {
  if (!content) return '';
  
  // Replace multiple whitespace with single space
  let normalized = content.replace(/\s+/g, ' ');
  
  // Remove control characters
  normalized = normalized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim whitespace
  normalized = normalized.trim();
  
  return normalized;
}

/**
 * Chunk content into smaller pieces if it's too large
 * @private
 * @param {string} content - Text content
 * @param {number} [maxChunkSize=5000] - Maximum characters per chunk
 * @returns {Array<string>} Array of content chunks
 */
function chunkContent(content, maxChunkSize = 5000) {
  if (!content) return [];
  
  // If content is small enough, return as single chunk
  if (content.length <= maxChunkSize) {
    return [content];
  }
  
  const chunks = [];
  
  // Split content by paragraphs
  const paragraphs = content.split(/\n\s*\n/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed max size, start a new chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    
    // If a single paragraph is larger than max size, split it by sentences
    if (paragraph.length > maxChunkSize) {
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
      
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If a single sentence is still too large, split arbitrarily
        if (sentence.length > maxChunkSize) {
          let remainingSentence = sentence;
          
          while (remainingSentence.length > 0) {
            const chunkSize = Math.min(maxChunkSize, remainingSentence.length);
            const sentenceChunk = remainingSentence.substring(0, chunkSize);
            chunks.push(sentenceChunk.trim());
            remainingSentence = remainingSentence.substring(chunkSize);
          }
        } else {
          currentChunk += sentence + ' ';
        }
      }
    } else {
      currentChunk += paragraph + '\n\n';
    }
  }
  
  // Add the last chunk if not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

module.exports = {
  processDocument,
  chunkContent
};
