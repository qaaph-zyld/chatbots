# Advanced Workflow Builder

## Overview

The Advanced Workflow Builder is a powerful visual tool for creating and managing conversational workflows for your chatbots. It allows you to design complex conversation flows with conditional logic, user input handling, integrations with external systems, and context-aware operations.

Built with React Flow for the visual editor and a comprehensive backend service, the Advanced Workflow Builder provides an intuitive interface for designing conversational experiences without requiring programming knowledge.

## Key Features

- **Visual Workflow Editor**: Drag-and-drop interface for creating workflows
- **Diverse Node Types**: Start, Message, Condition, Input, Action, Integration, Context, Jump, and End nodes
- **Conditional Logic**: Create branching conversations based on user input or data
- **External Integrations**: Connect to external APIs and services
- **Context Awareness**: Leverage the advanced context awareness features
- **Workflow Analytics**: Track and analyze workflow performance
- **Workflow Templates**: Pre-built templates for common use cases to help you get started quickly
- **Real-time Preview**: Test your workflows as you build them

## Node Types

### Start Node
- The entry point for your workflow
- Every workflow must have exactly one Start node

### Message Node
- Sends a message to the user
- Supports various message types: text, image, card, buttons, quick replies

### Condition Node
- Creates a branching path based on a condition
- Evaluates data using operators like equals, contains, greater than, etc.
- Has two output paths: true and false

### Input Node
- Collects input from the user
- Supports different input types: text, number, date, time, email, phone, select
- Can provide options for selection inputs

### Action Node
- Performs an action within the workflow
- Actions include: setting variables, calculating values, delays

### Integration Node
- Connects to external systems and APIs
- Supports HTTP requests with various methods
- Can pass data to and from external systems

### Context Node
- Interacts with the advanced context awareness system
- Can set user preferences, track entities, and detect topics

### Jump Node
- Jumps to another node in the workflow
- Useful for creating loops or skipping steps

### End Node
- Marks the end of a workflow path
- Terminates the execution of the workflow

## Creating a Workflow

1. Navigate to the Workflows section in your chatbot dashboard
2. Click "Create New Workflow"
3. Provide a name and description for your workflow
4. Use the visual editor to design your workflow:
   - Drag nodes from the palette to the canvas
   - Connect nodes by dragging from one handle to another
   - Configure node properties by clicking on a node
5. Save your workflow when finished

## Example Workflows

### Simple Greeting Workflow

1. **Start Node**: Entry point
2. **Message Node**: "Hello! How can I help you today?"
3. **Input Node**: Collect user response
4. **Condition Node**: Check if response contains keywords
   - If true: Jump to specific topic workflow
   - If false: Continue to general help
5. **Message Node**: "I'm here to help with any questions you have."
6. **End Node**: End the workflow

### Appointment Booking Workflow

1. **Start Node**: Entry point
2. **Message Node**: "Would you like to book an appointment?"
3. **Input Node**: Collect yes/no response
4. **Condition Node**: Check if response is affirmative
   - If false: Jump to End
5. **Message Node**: "What date would you prefer?"
6. **Input Node**: Collect date
7. **Integration Node**: Check availability with calendar API
8. **Condition Node**: Check if date is available
   - If false: Jump back to date input
9. **Message Node**: "What time would you prefer?"
10. **Input Node**: Collect time
11. **Integration Node**: Book appointment in calendar
12. **Message Node**: "Your appointment has been booked!"
13. **Context Node**: Save appointment as entity
14. **End Node**: End the workflow

## Workflow Execution

Workflows can be executed in several ways:

1. **Triggered by Intent**: Start a workflow when a specific intent is detected
2. **Triggered by Event**: Start a workflow when an event occurs (e.g., user joins)
3. **Triggered by API**: Start a workflow via API call
4. **Triggered by Another Workflow**: Chain workflows together

## Best Practices

1. **Start Simple**: Begin with simple workflows and gradually add complexity
2. **Test Thoroughly**: Test all paths in your workflow before deploying
3. **Handle Errors**: Include error handling for integrations and conditions
4. **Use Clear Labels**: Give nodes descriptive names for easier maintenance
5. **Document Your Workflow**: Add comments and documentation for complex workflows
6. **Monitor Performance**: Use analytics to identify bottlenecks or drop-offs

## Workflow Templates

The Advanced Workflow Builder includes a collection of pre-built templates to help you get started quickly. These templates cover common use cases and can be customized to fit your specific needs.

### Available Templates

1. **Customer Onboarding**
   - Guide new customers through your product or service
   - Collect basic information and provide personalized resources
   - 8 nodes with conditional branching based on user goals

2. **FAQ Bot**
   - Answer common questions and provide helpful resources
   - Process user questions and categorize them for appropriate responses
   - 5 nodes with question analysis and follow-up handling

3. **Appointment Booking**
   - Help users schedule appointments or meetings
   - Collect date, time, and appointment type preferences
   - 10 nodes with integration to calendar systems

4. **Lead Generation**
   - Collect user information and qualify leads
   - Gather contact details and understand user needs
   - 7 nodes with CRM integration

5. **Product Recommendation**
   - Help users find the right product based on their needs
   - Ask questions to understand user requirements
   - 12 nodes with advanced conditional logic

6. **Feedback Collection**
   - Gather customer feedback and satisfaction ratings
   - Collect quantitative and qualitative feedback
   - 6 nodes with sentiment analysis

### Using Templates

1. Navigate to the Workflows page for your chatbot
2. Click "Create New Workflow" or select "Templates" from the sidebar
3. Browse the available templates and select one that matches your needs
4. Click "Use Template" to create a new workflow based on the template
5. Customize the workflow to fit your specific requirements
6. Save and activate your workflow

## API Reference

The Advanced Workflow Builder provides a comprehensive API for programmatically managing workflows:

### Workflow Management

- `POST /api/chatbots/:chatbotId/workflows` - Create a new workflow
- `GET /api/chatbots/:chatbotId/workflows` - Get all workflows for a chatbot
- `GET /api/chatbots/:chatbotId/workflows/:workflowId` - Get a specific workflow
- `PUT /api/chatbots/:chatbotId/workflows/:workflowId` - Update a workflow
- `DELETE /api/chatbots/:chatbotId/workflows/:workflowId` - Delete a workflow

### Workflow Execution

- `POST /api/chatbots/:chatbotId/workflows/:workflowId/execute` - Start workflow execution
- `POST /api/workflow-executions/:executionId/input` - Process user input for a workflow
- `GET /api/workflow-executions/:executionId` - Get execution status
- `GET /api/chatbots/:chatbotId/workflows/:workflowId/executions` - Get all executions for a workflow

### Workflow Analytics

- `GET /api/chatbots/:chatbotId/workflows/:workflowId/analytics` - Get workflow analytics

## Troubleshooting

### Common Issues

1. **Workflow Not Starting**: 
   - Check if the workflow is set to active
   - Verify trigger conditions are correct

2. **Workflow Stuck**: 
   - Check for missing connections between nodes
   - Verify external integrations are working

3. **Condition Not Working**: 
   - Verify the field path is correct
   - Check the data format matches the comparison

4. **Integration Failing**: 
   - Check the URL and authentication
   - Verify the request format is correct

### Debugging Tools

- **Execution Logs**: View detailed logs of workflow execution
- **Visual Debugger**: Step through workflow execution visually
- **Test Mode**: Test workflows without affecting production

## Conclusion

The Advanced Workflow Builder empowers you to create sophisticated conversational experiences with your chatbots. By combining the various node types and leveraging the advanced context awareness features, you can build workflows that are both powerful and natural for your users.

For additional help, refer to the API documentation or contact our support team.
