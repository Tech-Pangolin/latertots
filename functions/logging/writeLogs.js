const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

/**
 * Write client-side logs to Google Cloud Logging
 * Uses Firebase Functions' built-in logger which automatically goes to Google Cloud Logging
 */
exports.writeLogs = onRequest(
  {
    cors: true,
    region: 'us-central1',
    invoker: 'public'
  },
  async (request, response) => {
    
    try {
      // Check authentication - manually verify the token
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      let userId;
      
      try {
        // Verify the token using Firebase Admin SDK
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (error) {
        response.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { level, message, args, url, timestamp } = request.body;
      
      // Validate required fields
      if (!level || !message) {
        logger.error('Invalid log request (missing level or message):', { level, message, args, url, timestamp });
        response.status(400);
        return;
      }

      // Use Firebase's built-in logger - automatically goes to Google Cloud Logging
      // Add [Client] prefix to distinguish from server-side logs
      const logMessage = `[Client] ${message}`;
      const logData = {
        userId,
        url: url || 'unknown',
        args: args || [],
        timestamp: timestamp || new Date().toISOString()
      };

      // Use appropriate log level
      switch (level.toLowerCase()) {
        case 'error':
          logger.error(logMessage, logData);
          break;
        case 'warn':
          logger.warn(logMessage, logData);
          break;
        case 'info':
          logger.info(logMessage, logData);
          break;
        case 'debug':
          logger.debug(logMessage, logData);
          break;
        default:
          logger.info(logMessage, logData);
      }
      
      response.status(200).json({ success: true });
    } catch (error) {
      logger.error('Failed to write client log:', error);
      response.status(500).json({ error: 'Internal server error' });
    }
  }
);
