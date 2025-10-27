const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');

const db = getFirestore();

/**
 * Upsert form draft - creates or updates a form draft for a user
 * Uses Admin SDK to bypass security rules
 */
exports.upsertFormDraft = onRequest(
  {
    cors: true
  },
  async (request, response) => {
    try {
    
    if (request.method !== 'POST') {
      response.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    const { userId, draftData } = request.body;
    
    if (!userId || !draftData) {
      response.status(400).json({ 
        success: false, 
        error: 'userId and draftData are required' 
      });
      return;
    }

    const draftRef = db.collection('FormDrafts').doc(userId);
    
    // Convert date strings to Firestore Timestamps
    const processedDraftData = {
      ...draftData,
      createdAt: draftData.createdAt ? Timestamp.fromDate(new Date(draftData.createdAt)) : Timestamp.now(),
      expiresAt: draftData.expiresAt ? Timestamp.fromDate(new Date(draftData.expiresAt)) : Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)) // 1 hour from now
    };
    
    // Set the draft data (this will create if not exists, update if exists)
    await draftRef.set(processedDraftData);
    
    logger.info(`Form draft upserted for user: ${userId}`);
    
    response.status(200).json({
      success: true,
      message: 'Form draft saved successfully'
    });
    
  } catch (error) {
    logger.error('Error upserting form draft:', error);
    response.status(500).json({
      success: false,
      error: `Failed to save form draft: ${error.message}`
    });
  }
});
