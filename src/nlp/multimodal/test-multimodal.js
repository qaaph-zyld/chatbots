/**
 * Multi-Modal Input/Output Test Script
 * 
 * This script demonstrates how to use the multi-modal input and output
 * capabilities of the chatbot platform.
 */

const path = require('path');
const fs = require('fs');
require('@src/nlp\multimodal\input');
require('@src/nlp\multimodal\output');
require('@src/utils');

/**
 * Run multi-modal tests
 */
async function runTests() {
  try {
    logger.info('Testing Multi-Modal Input/Output Capabilities');
    logger.info('===========================================\n');
    
    // Initialize services
    logger.info('Initializing services...');
    await inputService.initialize();
    await outputService.initialize();
    logger.info('Services initialized successfully\n');
    
    // Test rich UI components
    await testRichComponents();
    
    // Test text-to-speech
    await testTextToSpeech();
    
    // Test image processing (if sample image is available)
    const sampleImagePath = path.join(__dirname, 'samples', 'sample-image.jpg');
    if (fs.existsSync(sampleImagePath)) {
      await testImageProcessing(sampleImagePath);
    } else {
      logger.info('Skipping image processing test (no sample image available)');
    }
    
    // Test audio processing (if sample audio is available)
    const sampleAudioPath = path.join(__dirname, 'samples', 'sample-audio.wav');
    if (fs.existsSync(sampleAudioPath)) {
      await testAudioProcessing(sampleAudioPath);
    } else {
      logger.info('Skipping audio processing test (no sample audio available)');
    }
    
    // Test complete multi-modal response
    await testCompleteResponse();
    
    logger.info('\nAll tests completed successfully');
  } catch (error) {
    logger.error('Error running multi-modal tests:', error.message);
  }
}

/**
 * Test rich UI components
 */
async function testRichComponents() {
  logger.info('Testing Rich UI Components:');
  
  // Create a basic card
  const basicCard = outputService.createCard('basic', {
    title: 'Basic Card Title',
    subtitle: 'This is a basic card subtitle',
    imageUrl: 'https://example.com/image.jpg',
    buttons: [
      { text: 'Button 1', value: 'button_1' },
      { text: 'Button 2', value: 'button_2' }
    ]
  });
  
  logger.info('Basic Card:', JSON.stringify(basicCard, null, 2));
  
  // Create a product card
  const productCard = outputService.createCard('product', {
    title: 'Product Name',
    subtitle: 'Product Description',
    price: '$19.99',
    imageUrl: 'https://example.com/product.jpg',
    buttons: [
      { text: 'Buy Now', value: 'buy_now' },
      { text: 'Add to Cart', value: 'add_to_cart' }
    ]
  });
  
  logger.info('Product Card:', JSON.stringify(productCard, null, 2));
  
  // Create a carousel
  const carousel = outputService.createCarousel([
    {
      title: 'Item 1',
      subtitle: 'Description 1',
      imageUrl: 'https://example.com/item1.jpg'
    },
    {
      title: 'Item 2',
      subtitle: 'Description 2',
      imageUrl: 'https://example.com/item2.jpg'
    },
    {
      title: 'Item 3',
      subtitle: 'Description 3',
      imageUrl: 'https://example.com/item3.jpg'
    }
  ]);
  
  logger.info('Carousel:', JSON.stringify(carousel, null, 2));
  
  // Create quick replies
  const quickReplies = outputService.createQuickReplies(
    'What would you like to do next?',
    ['Option 1', 'Option 2', 'Option 3']
  );
  
  logger.info('Quick Replies:', JSON.stringify(quickReplies, null, 2));
  
  logger.info('Rich UI Components test completed successfully\n');
}

/**
 * Test text-to-speech
 */
async function testTextToSpeech() {
  logger.info('Testing Text-to-Speech:');
  
  try {
    const text = 'Hello, this is a test of the text-to-speech capabilities.';
    
    logger.info(`Generating speech for text: "${text}"`);
    
    const result = await outputService.generateSpeech(text, {
      voice: 'female',
      rate: 1.0
    });
    
    logger.info('Speech generated successfully:');
    logger.info(`- Format: ${result.format}`);
    logger.info(`- Duration: ${result.duration.toFixed(2)} seconds`);
    logger.info(`- Audio URL: ${result.audioUrl}`);
    
    logger.info('Text-to-Speech test completed successfully\n');
  } catch (error) {
    logger.error('Error testing text-to-speech:', error.message);
  }
}

/**
 * Test image processing
 * @param {string} imagePath - Path to sample image
 */
async function testImageProcessing(imagePath) {
  logger.info('Testing Image Processing:');
  
  try {
    logger.info(`Processing image: ${imagePath}`);
    
    const result = await inputService.processImage({
      path: imagePath
    }, {
      detectObjects: true,
      detectFaces: true,
      extractColors: true
    });
    
    if (result.success) {
      logger.info('Image processed successfully:');
      logger.info(`- Dimensions: ${result.imageInfo.width}x${result.imageInfo.height}`);
      
      if (result.features.faces) {
        logger.info(`- Faces detected: ${result.features.faces.count}`);
      }
      
      if (result.features.objects) {
        logger.info(`- Objects detected: ${result.features.objects.count}`);
        
        if (result.features.objects.objects && result.features.objects.objects.length > 0) {
          logger.info('  Objects:');
          result.features.objects.objects.forEach(obj => {
            logger.info(`  - ${obj.className} (confidence: ${obj.confidence.toFixed(2)})`);
          });
        }
      }
      
      if (result.features.colors) {
        logger.info('- Dominant colors:');
        result.features.colors.slice(0, 3).forEach(color => {
          logger.info(`  - ${color.hex} (${(color.percentage * 100).toFixed(2)}%)`);
        });
      }
    } else {
      logger.warn('Image processing failed:', result.error);
    }
    
    logger.info('Image Processing test completed\n');
  } catch (error) {
    logger.error('Error testing image processing:', error.message);
  }
}

/**
 * Test audio processing
 * @param {string} audioPath - Path to sample audio
 */
async function testAudioProcessing(audioPath) {
  logger.info('Testing Audio Processing:');
  
  try {
    logger.info(`Processing audio: ${audioPath}`);
    
    const result = await inputService.processAudio({
      path: audioPath
    }, {
      speechToText: true,
      analyzeAudio: true
    });
    
    if (result.success) {
      logger.info('Audio processed successfully:');
      logger.info(`- Format: ${result.audioInfo.format}`);
      logger.info(`- Duration: ${result.audioInfo.duration.toFixed(2)} seconds`);
      
      if (result.features.transcription) {
        logger.info(`- Transcription: "${result.features.transcription.text}"`);
        logger.info(`- Engine: ${result.features.transcription.engine}`);
      }
      
      if (result.features.audioFeatures) {
        logger.info('- Audio features:');
        logger.info(`  - Tempo: ${result.features.audioFeatures.tempo.toFixed(2)} BPM`);
        logger.info(`  - Energy: ${result.features.audioFeatures.rmsEnergy.toFixed(4)}`);
      }
    } else {
      logger.warn('Audio processing failed:', result.error);
    }
    
    logger.info('Audio Processing test completed\n');
  } catch (error) {
    logger.error('Error testing audio processing:', error.message);
  }
}

/**
 * Test complete multi-modal response
 */
async function testCompleteResponse() {
  logger.info('Testing Complete Multi-Modal Response:');
  
  try {
    const response = await outputService.createResponse({
      text: 'Here are some products you might be interested in:',
      speech: {
        text: 'Here are some products you might be interested in. Would you like more information about any of them?'
      },
      carousel: {
        items: [
          {
            title: 'Product 1',
            subtitle: '$19.99',
            imageUrl: 'https://example.com/product1.jpg'
          },
          {
            title: 'Product 2',
            subtitle: '$24.99',
            imageUrl: 'https://example.com/product2.jpg'
          },
          {
            title: 'Product 3',
            subtitle: '$15.99',
            imageUrl: 'https://example.com/product3.jpg'
          }
        ]
      },
      quickReplies: {
        replies: ['Show more', 'Filter results', 'Sort by price']
      }
    });
    
    logger.info('Complete response created successfully:');
    logger.info(`- Response ID: ${response.id}`);
    logger.info(`- Components: ${response.components.length}`);
    logger.info(`- Component types: ${response.components.map(c => c.type).join(', ')}`);
    
    logger.info('Complete Multi-Modal Response test completed successfully\n');
  } catch (error) {
    logger.error('Error testing complete response:', error.message);
  }
}

// Run the tests
runTests();
