# Domain-Specific Training System

This directory contains the domain-specific training system implementation for the Open-Source Chatbots Platform. The training system allows chatbots to be trained on domain-specific data, making them more effective for specific use cases.

## Features

- **Domain Management**: Create, update, and manage training domains (e.g., customer support, e-commerce, healthcare)
- **Dataset Management**: Create, update, and manage training datasets for different domains
- **Multiple Framework Support**: Integration with popular open-source training frameworks (Rasa, DeepPavlov, Botpress)
- **File Management**: Upload, download, and manage training data files
- **Training Jobs**: Start, monitor, and manage training jobs for chatbots
- **Sample Data**: Pre-defined sample training data for common domains

## Components

- **Training Service**: Core service for managing domains, datasets, and training jobs
- **Training Controller**: API controller for handling training-related HTTP requests
- **Training Routes**: API routes for training management

## Supported Frameworks

The system supports the following training frameworks:

1. **Rasa**: Open-source machine learning framework for automated text and voice-based conversations
2. **DeepPavlov**: Open-source conversational AI library built on TensorFlow
3. **Botpress**: Open-source conversational assistant creation platform

## Domain Structure

Each training domain has the following structure:

```javascript
{
  id: 'domain-id',
  name: 'Domain Name',
  description: 'Domain description',
  language: 'en', // ISO language code
  created_at: 1621234567890,
  updated_at: 1621234567890
}
```

## Dataset Structure

Each training dataset has the following structure:

```javascript
{
  id: 'dataset-id',
  domain_id: 'domain-id',
  framework: 'rasa', // rasa, deeppavlov, botpress
  name: 'Dataset Name',
  description: 'Dataset description',
  files: ['file1.yml', 'file2.yml'], // List of files in the dataset
  created_at: 1621234567890,
  updated_at: 1621234567890
}
```

## Training Job Structure

Each training job has the following structure:

```javascript
{
  id: 'job-id',
  bot_id: 'bot-id',
  dataset_id: 'dataset-id',
  domain_id: 'domain-id',
  framework: 'rasa',
  status: 'pending', // pending, running, completed, failed
  created_at: 1621234567890,
  updated_at: 1621234567890,
  completed_at: 1621234567890 // Only present if status is completed or failed
}
```

## API Endpoints

The training system exposes the following API endpoints:

### Domains

- `GET /api/training/domains`: Get all training domains
- `GET /api/training/domains/:id`: Get a specific domain by ID
- `POST /api/training/domains`: Create a new domain
- `PUT /api/training/domains/:id`: Update an existing domain
- `DELETE /api/training/domains/:id`: Delete a domain

### Datasets

- `GET /api/training/datasets`: Get all training datasets
- `GET /api/training/datasets/:id`: Get a specific dataset by ID
- `POST /api/training/datasets`: Create a new dataset
- `PUT /api/training/datasets/:id`: Update an existing dataset
- `DELETE /api/training/datasets/:id`: Delete a dataset
- `GET /api/training/datasets/:id/files/:fileName`: Get a specific file from a dataset

### Training

- `POST /api/training/bots/:botId/train/:datasetId`: Train a bot using a specific dataset
- `GET /api/training/jobs`: Get all training jobs
- `GET /api/training/jobs/:id`: Get a specific training job by ID
- `GET /api/training/frameworks`: Get available training frameworks

## Usage Examples

### Creating a Domain and Dataset

```javascript
const { trainingService } = require('./training');

async function createDomainAndDataset() {
  // Create a domain
  const domain = await trainingService.createDomain({
    name: 'Customer Support',
    description: 'Training data for customer support chatbots',
    language: 'en'
  });
  
  console.log('Domain created:', domain);
  
  // Create a dataset
  const dataset = await trainingService.createDataset({
    name: 'Customer Support Rasa Dataset',
    description: 'Training data for customer support using Rasa',
    domain_id: domain.id,
    framework: 'rasa'
  });
  
  console.log('Dataset created:', dataset);
}
```

### Training a Bot

```javascript
const { trainingService } = require('./training');

async function trainBot(botId, datasetId) {
  try {
    const result = await trainingService.trainBot(botId, datasetId);
    console.log('Bot trained successfully:', result);
  } catch (error) {
    console.error('Error training bot:', error.message);
  }
}
```

## Integration with Other Components

The training system integrates with the following components:

- **Storage Service**: Domains, datasets, and training jobs are stored and retrieved using the local storage service
- **Bot Service**: Bots are updated with training information when training is completed
- **NLP Service**: Trained models can be used by the NLP service for intent recognition and entity extraction

## Sample Data

The system comes with sample training data for the following domains:

1. **Customer Support**: Sample data for customer support chatbots using Rasa
2. **E-Commerce**: Sample data for e-commerce chatbots using DeepPavlov
3. **Healthcare**: Sample data for healthcare chatbots using Botpress

## Extending

To add a new training framework:

1. Update the `frameworks` object in the training service with the new framework details
2. Create sample data for the new framework
3. Implement the necessary logic to handle the new framework's data format

## License

This component is licensed under the MIT License, the same as the main project.
