/**
 * UAT Feedback Collector
 * 
 * This utility collects and processes feedback from User Acceptance Testing (UAT)
 * participants. It provides mechanisms for structured feedback collection,
 * sentiment analysis, and reporting.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('@src/utils\logger');
require('@src/services\nlp.service');

/**
 * Schema for UAT feedback
 */
const UATFeedbackSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['admin', 'creator', 'user'],
    required: true
  },
  testCase: {
    type: String,
    required: true
  },
  feature: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  feedback: {
    type: String
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },
  usabilityIssues: [{
    type: String
  }],
  suggestions: [{
    type: String
  }],
  browserInfo: {
    type: Object
  },
  deviceInfo: {
    type: Object
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create model if it doesn't exist
let UATFeedback;
try {
  UATFeedback = mongoose.model('UATFeedback');
} catch (error) {
  UATFeedback = mongoose.model('UATFeedback', UATFeedbackSchema);
}

/**
 * UAT Feedback Collector class
 */
class UATFeedbackCollector {
  constructor() {
    this.currentSession = null;
    this.feedbackDirectory = path.join(__dirname, '../../reports/uat-feedback');
    
    // Ensure feedback directory exists
    if (!fs.existsSync(this.feedbackDirectory)) {
      fs.mkdirSync(this.feedbackDirectory, { recursive: true });
    }
  }

  /**
   * Start a new UAT session
   * @param {Object} options - Session options
   * @returns {Object} Session information
   */
  startSession(options = {}) {
    const sessionId = options.sessionId || uuidv4();
    const timestamp = new Date();
    const formattedDate = timestamp.toISOString().split('T')[0];
    
    this.currentSession = {
      id: sessionId,
      startTime: timestamp,
      participants: options.participants || [],
      testCases: options.testCases || [],
      feedbackCount: 0,
      feedbackFile: path.join(this.feedbackDirectory, `uat-feedback-${formattedDate}-${sessionId}.json`)
    };
    
    logger.info(`Started UAT feedback session: ${sessionId}`, {
      participants: this.currentSession.participants.length,
      testCases: this.currentSession.testCases.length
    });
    
    // Initialize feedback file
    fs.writeFileSync(
      this.currentSession.feedbackFile,
      JSON.stringify({
        session: {
          id: sessionId,
          startTime: timestamp,
          participants: this.currentSession.participants,
          testCases: this.currentSession.testCases
        },
        feedback: []
      }, null, 2)
    );
    
    return this.currentSession;
  }

  /**
   * End the current UAT session
   * @returns {Object} Session summary
   */
  endSession() {
    if (!this.currentSession) {
      throw new Error('No active UAT session');
    }
    
    const endTime = new Date();
    const duration = endTime - this.currentSession.startTime;
    
    // Update feedback file with session end time
    const feedbackData = JSON.parse(fs.readFileSync(this.currentSession.feedbackFile, 'utf8'));
    feedbackData.session.endTime = endTime;
    feedbackData.session.duration = duration;
    feedbackData.session.feedbackCount = this.currentSession.feedbackCount;
    
    fs.writeFileSync(
      this.currentSession.feedbackFile,
      JSON.stringify(feedbackData, null, 2)
    );
    
    const summary = {
      sessionId: this.currentSession.id,
      startTime: this.currentSession.startTime,
      endTime,
      duration,
      participants: this.currentSession.participants.length,
      feedbackCount: this.currentSession.feedbackCount,
      feedbackFile: this.currentSession.feedbackFile
    };
    
    logger.info(`Ended UAT feedback session: ${this.currentSession.id}`, {
      duration: `${Math.round(duration / 1000 / 60)} minutes`,
      feedbackCount: this.currentSession.feedbackCount
    });
    
    this.currentSession = null;
    
    return summary;
  }

  /**
   * Record feedback from a UAT participant
   * @param {Object} feedback - Feedback data
   * @returns {Object} Processed feedback
   */
  async recordFeedback(feedback) {
    if (!this.currentSession) {
      throw new Error('No active UAT session');
    }
    
    try {
      // Add session ID if not provided
      feedback.sessionId = feedback.sessionId || this.currentSession.id;
      
      // Process feedback text if available
      if (feedback.feedback) {
        // Analyze sentiment
        try {
          const sentimentResult = await nlpService.analyzeSentiment(feedback.feedback);
          feedback.sentiment = sentimentResult.sentiment;
        } catch (error) {
          logger.warn('Error analyzing sentiment for UAT feedback', error);
          feedback.sentiment = 'neutral';
        }
        
        // Extract usability issues and suggestions
        try {
          const entities = await nlpService.extractEntities(feedback.feedback);
          feedback.usabilityIssues = entities
            .filter(entity => entity.type === 'ISSUE' || entity.type === 'PROBLEM')
            .map(entity => entity.text);
          
          feedback.suggestions = entities
            .filter(entity => entity.type === 'SUGGESTION' || entity.type === 'IMPROVEMENT')
            .map(entity => entity.text);
        } catch (error) {
          logger.warn('Error extracting entities from UAT feedback', error);
          feedback.usabilityIssues = [];
          feedback.suggestions = [];
        }
      }
      
      // Add timestamp if not provided
      feedback.timestamp = feedback.timestamp || new Date();
      
      // Save to database if connected
      if (mongoose.connection.readyState === 1) {
        const feedbackModel = new UATFeedback(feedback);
        await feedbackModel.save();
      }
      
      // Save to feedback file
      const feedbackData = JSON.parse(fs.readFileSync(this.currentSession.feedbackFile, 'utf8'));
      feedbackData.feedback.push(feedback);
      
      fs.writeFileSync(
        this.currentSession.feedbackFile,
        JSON.stringify(feedbackData, null, 2)
      );
      
      // Increment feedback count
      this.currentSession.feedbackCount++;
      
      logger.info(`Recorded UAT feedback from ${feedback.userId} for ${feedback.feature}`, {
        rating: feedback.rating,
        sentiment: feedback.sentiment
      });
      
      return feedback;
    } catch (error) {
      logger.error('Error recording UAT feedback', error);
      throw error;
    }
  }

  /**
   * Generate a report from collected feedback
   * @param {string} sessionId - Session ID to generate report for (defaults to current session)
   * @returns {Object} Feedback report
   */
  async generateReport(sessionId) {
    try {
      const targetSessionId = sessionId || (this.currentSession ? this.currentSession.id : null);
      
      if (!targetSessionId) {
        throw new Error('No session ID provided and no active session');
      }
      
      let feedbackData;
      
      // If this is the current session, read from the file
      if (this.currentSession && targetSessionId === this.currentSession.id) {
        feedbackData = JSON.parse(fs.readFileSync(this.currentSession.feedbackFile, 'utf8'));
      } else {
        // Otherwise, try to find the session file
        const files = fs.readdirSync(this.feedbackDirectory);
        const sessionFile = files.find(file => file.includes(targetSessionId));
        
        if (!sessionFile) {
          throw new Error(`No feedback file found for session ${targetSessionId}`);
        }
        
        feedbackData = JSON.parse(fs.readFileSync(path.join(this.feedbackDirectory, sessionFile), 'utf8'));
      }
      
      // Generate report
      const feedback = feedbackData.feedback;
      const session = feedbackData.session;
      
      // Calculate overall statistics
      const overallRating = feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length;
      
      const sentimentCounts = feedback.reduce((counts, item) => {
        counts[item.sentiment] = (counts[item.sentiment] || 0) + 1;
        return counts;
      }, {});
      
      // Group feedback by feature
      const featureFeedback = feedback.reduce((groups, item) => {
        if (!groups[item.feature]) {
          groups[item.feature] = [];
        }
        groups[item.feature].push(item);
        return groups;
      }, {});
      
      // Calculate feature ratings
      const featureRatings = Object.entries(featureFeedback).map(([feature, items]) => {
        const rating = items.reduce((sum, item) => sum + item.rating, 0) / items.length;
        return { feature, rating, count: items.length };
      });
      
      // Collect all usability issues and suggestions
      const allIssues = feedback.flatMap(item => item.usabilityIssues || []);
      const allSuggestions = feedback.flatMap(item => item.suggestions || []);
      
      // Group by user role
      const roleBasedFeedback = feedback.reduce((groups, item) => {
        if (!groups[item.userRole]) {
          groups[item.userRole] = [];
        }
        groups[item.userRole].push(item);
        return groups;
      }, {});
      
      // Calculate role-based ratings
      const roleRatings = Object.entries(roleBasedFeedback).map(([role, items]) => {
        const rating = items.reduce((sum, item) => sum + item.rating, 0) / items.length;
        return { role, rating, count: items.length };
      });
      
      // Generate report
      const report = {
        sessionId: session.id,
        startTime: session.startTime,
        endTime: session.endTime || new Date(),
        duration: (session.endTime || new Date()) - new Date(session.startTime),
        participantCount: session.participants.length,
        feedbackCount: feedback.length,
        overallRating,
        sentimentBreakdown: sentimentCounts,
        featureRatings,
        roleRatings,
        topIssues: this.getTopItems(allIssues, 10),
        topSuggestions: this.getTopItems(allSuggestions, 10),
        detailedFeedback: featureFeedback
      };
      
      // Save report
      const reportFile = path.join(
        this.feedbackDirectory,
        `uat-report-${targetSessionId}.json`
      );
      
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      
      logger.info(`Generated UAT feedback report for session ${targetSessionId}`, {
        overallRating,
        feedbackCount: feedback.length,
        reportFile
      });
      
      return report;
    } catch (error) {
      logger.error('Error generating UAT feedback report', error);
      throw error;
    }
  }

  /**
   * Get the most common items from an array
   * @param {Array} items - Array of items
   * @param {number} limit - Maximum number of items to return
   * @returns {Array} Top items with counts
   */
  getTopItems(items, limit = 10) {
    const counts = items.reduce((counts, item) => {
      counts[item] = (counts[item] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item, count]) => ({ item, count }));
  }

  /**
   * Generate a markdown report from collected feedback
   * @param {string} sessionId - Session ID to generate report for
   * @returns {string} Markdown report
   */
  async generateMarkdownReport(sessionId) {
    try {
      const report = await this.generateReport(sessionId);
      
      // Format date
      const startDate = new Date(report.startTime).toLocaleDateString();
      const startTime = new Date(report.startTime).toLocaleTimeString();
      const durationMinutes = Math.round(report.duration / 1000 / 60);
      
      let markdown = `# UAT Feedback Report\n\n`;
      markdown += `**Session ID:** ${report.sessionId}\n`;
      markdown += `**Date:** ${startDate}\n`;
      markdown += `**Time:** ${startTime}\n`;
      markdown += `**Duration:** ${durationMinutes} minutes\n`;
      markdown += `**Participants:** ${report.participantCount}\n`;
      markdown += `**Feedback Items:** ${report.feedbackCount}\n\n`;
      
      markdown += `## Overall Results\n\n`;
      markdown += `**Average Rating:** ${report.overallRating.toFixed(1)} / 5.0\n\n`;
      
      markdown += `### Sentiment Breakdown\n\n`;
      markdown += `| Sentiment | Count | Percentage |\n`;
      markdown += `|-----------|-------|------------|\n`;
      
      const sentiments = Object.entries(report.sentimentBreakdown);
      sentiments.forEach(([sentiment, count]) => {
        const percentage = ((count / report.feedbackCount) * 100).toFixed(1);
        markdown += `| ${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} | ${count} | ${percentage}% |\n`;
      });
      
      markdown += `\n## Feature Ratings\n\n`;
      markdown += `| Feature | Rating | Feedback Count |\n`;
      markdown += `|---------|--------|---------------|\n`;
      
      report.featureRatings
        .sort((a, b) => b.rating - a.rating)
        .forEach(({ feature, rating, count }) => {
          markdown += `| ${feature} | ${rating.toFixed(1)} | ${count} |\n`;
        });
      
      markdown += `\n## Role-Based Feedback\n\n`;
      markdown += `| User Role | Rating | Feedback Count |\n`;
      markdown += `|-----------|--------|---------------|\n`;
      
      report.roleRatings
        .sort((a, b) => b.rating - a.rating)
        .forEach(({ role, rating, count }) => {
          markdown += `| ${role.charAt(0).toUpperCase() + role.slice(1)} | ${rating.toFixed(1)} | ${count} |\n`;
        });
      
      markdown += `\n## Top Issues Identified\n\n`;
      
      if (report.topIssues.length === 0) {
        markdown += `No specific issues identified.\n\n`;
      } else {
        markdown += `| Issue | Mentions |\n`;
        markdown += `|-------|----------|\n`;
        
        report.topIssues.forEach(({ item, count }) => {
          markdown += `| ${item} | ${count} |\n`;
        });
      }
      
      markdown += `\n## Top Suggestions\n\n`;
      
      if (report.topSuggestions.length === 0) {
        markdown += `No specific suggestions provided.\n\n`;
      } else {
        markdown += `| Suggestion | Mentions |\n`;
        markdown += `|------------|----------|\n`;
        
        report.topSuggestions.forEach(({ item, count }) => {
          markdown += `| ${item} | ${count} |\n`;
        });
      }
      
      markdown += `\n## Detailed Feedback by Feature\n\n`;
      
      Object.entries(report.detailedFeedback).forEach(([feature, items]) => {
        markdown += `### ${feature}\n\n`;
        markdown += `**Average Rating:** ${(items.reduce((sum, item) => sum + item.rating, 0) / items.length).toFixed(1)} / 5.0\n\n`;
        
        items.forEach((item, index) => {
          markdown += `#### Feedback ${index + 1}\n\n`;
          markdown += `- **User Role:** ${item.userRole}\n`;
          markdown += `- **Rating:** ${item.rating} / 5\n`;
          markdown += `- **Sentiment:** ${item.sentiment}\n`;
          
          if (item.feedback) {
            markdown += `- **Feedback:** "${item.feedback}"\n`;
          }
          
          if (item.usabilityIssues && item.usabilityIssues.length > 0) {
            markdown += `- **Issues:**\n`;
            item.usabilityIssues.forEach(issue => {
              markdown += `  - ${issue}\n`;
            });
          }
          
          if (item.suggestions && item.suggestions.length > 0) {
            markdown += `- **Suggestions:**\n`;
            item.suggestions.forEach(suggestion => {
              markdown += `  - ${suggestion}\n`;
            });
          }
          
          markdown += `\n`;
        });
      });
      
      markdown += `## Conclusion\n\n`;
      
      // Add conclusion based on overall rating
      if (report.overallRating >= 4.5) {
        markdown += `The UAT session was highly successful with excellent feedback. Users are very satisfied with the platform's functionality and usability.\n\n`;
      } else if (report.overallRating >= 4.0) {
        markdown += `The UAT session was successful with positive feedback. Users are satisfied with the platform, with some minor suggestions for improvement.\n\n`;
      } else if (report.overallRating >= 3.5) {
        markdown += `The UAT session showed generally positive results, but with some areas needing improvement before final release.\n\n`;
      } else if (report.overallRating >= 3.0) {
        markdown += `The UAT session revealed several areas that need attention before the platform is ready for release.\n\n`;
      } else {
        markdown += `The UAT session identified significant issues that must be addressed before proceeding with the release.\n\n`;
      }
      
      markdown += `### Next Steps\n\n`;
      
      // Add next steps based on overall rating
      if (report.overallRating >= 4.0) {
        markdown += `1. Address any identified issues\n`;
        markdown += `2. Consider implementing top suggestions in future updates\n`;
        markdown += `3. Proceed with final release preparations\n`;
      } else if (report.overallRating >= 3.0) {
        markdown += `1. Address all identified issues\n`;
        markdown += `2. Implement critical suggestions\n`;
        markdown += `3. Conduct a follow-up UAT session to verify improvements\n`;
        markdown += `4. Proceed with release after verification\n`;
      } else {
        markdown += `1. Address all identified issues as a priority\n`;
        markdown += `2. Implement critical suggestions\n`;
        markdown += `3. Conduct comprehensive follow-up testing\n`;
        markdown += `4. Schedule another full UAT session before release\n`;
      }
      
      // Save markdown report
      const reportFile = path.join(
        this.feedbackDirectory,
        `uat-report-${report.sessionId}.md`
      );
      
      fs.writeFileSync(reportFile, markdown);
      
      logger.info(`Generated UAT feedback markdown report for session ${report.sessionId}`, {
        reportFile
      });
      
      return markdown;
    } catch (error) {
      logger.error('Error generating UAT feedback markdown report', error);
      throw error;
    }
  }
}

module.exports = new UATFeedbackCollector();
