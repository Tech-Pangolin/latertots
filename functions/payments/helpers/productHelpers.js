// productHelpers.js - Stripe product fetching and Firestore integration helpers

const Stripe = require('stripe');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const { stripeSecretKey } = require('../../config');

const db = getFirestore();

/**
 * Daily sync: Fetch all Stripe products and completely overwrite ServicePrices collection
 * @param {string} secretKey - Stripe secret key
 * @returns {Promise<Object>} - Results summary
 */
const syncAllStripeProducts = async (secretKey) => {
  const stripe = new Stripe(secretKey);
  
  try {
    
    // Fetch all products with their default prices
    const products = await stripe.products.list({
      limit: 100,
      active: true,
      expand: ['data.default_price']
    });
    
    logger.debug(`📦 [syncAllStripeProducts] Found ${products.data.length} products from Stripe`);
    
    const servicePrices = [];
    const errors = [];
    
    // Process each product
    for (const product of products.data) {
      try {
        // Skip products without a default price
        if (!product.default_price) {
          logger.warn(`⚠️ [syncAllStripeProducts] Product ${product.id} has no default price, skipping`);
          continue;
        }
        
        // Extract price information
        const price = product.default_price;
        const pricePerUnitInCents = price.unit_amount;
        
        // Create ServicePrices document
        const servicePrice = {
          stripeId: product.id,
          description: product.description || '',
          name: product.name,
          pricePerUnitInCents: pricePerUnitInCents
        };
        
        servicePrices.push(servicePrice);
        
        logger.debug(`✅ [syncAllStripeProducts] Processed product: ${product.name} (${product.id})`);
        
      } catch (productError) {
        logger.error(`❌ [syncAllStripeProducts] Error processing product ${product.id}:`, {
          error: productError.message,
          productName: product.name
        });
        errors.push({
          productId: product.id,
          productName: product.name,
          error: productError.message
        });
      }
    }
    
    // Delete all existing documents and write new ones
    if (servicePrices.length > 0) {
      // Get all existing documents to delete them
      const existingSnapshot = await db.collection('ServicePrices').get();
      const batch = db.batch();
      
      // Delete all existing documents
      existingSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Add all new documents
      servicePrices.forEach(servicePrice => {
        const docRef = db.collection('ServicePrices').doc(servicePrice.stripeId);
        batch.set(docRef, servicePrice);
      });
      
      await batch.commit();
    }
    
    const result = {
      success: true,
      totalProducts: products.data.length,
      processedProducts: servicePrices.length,
      errors: errors.length,
      errorDetails: errors
    };
    
    logger.info('✅ [syncAllStripeProducts] Sync complete', result);
    
    return result;
    
  } catch (error) {
    logger.error('❌ [syncAllStripeProducts] Failed to sync products:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Scheduled function: Daily sync of Stripe products
 * Runs every day at 2 AM UTC to sync product prices
 */
const dailyProductSync = onSchedule(
  {
    schedule: '0 2 * * *', // Every day at 2 AM UTC
    timeZone: 'UTC',
    secrets: [stripeSecretKey]
  },
  async (event) => {
    try {
      const result = await syncAllStripeProducts(stripeSecretKey.value());
      
      logger.info('✅ [dailyProductSync] Scheduled product sync completed:', result);
      
    } catch (error) {
      logger.error('❌ [dailyProductSync] Scheduled sync failed:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
);

/**
 * HTTP function: Manual trigger for product sync (for testing)
 * POST /syncProducts
 */
const syncProductsManual = onRequest(
  {
    secrets: [stripeSecretKey],
    cors: true
  },
  async (request, response) => {
    try {
      
      const result = await syncAllStripeProducts(stripeSecretKey.value());
      
      logger.info('✅ [syncProductsManual] Manual sync completed:', result);
      
      response.json({
        success: true,
        message: 'Product sync completed successfully',
        result
      });
      
    } catch (error) {
      logger.error('❌ [syncProductsManual] Manual sync failed:', {
        error: error.message,
        stack: error.stack
      });
      
      response.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

module.exports = {
  syncAllStripeProducts,
  dailyProductSync,
  syncProductsManual
};
