/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const logger = require("firebase-functions/logger");
const admin = require('firebase-admin');
admin.initializeApp();

exports.updateAdminClaims = functions.firestore
  .document('Users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;

    // Get the previous and new data
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Get the new Role reference
    const newRoleRef = afterData.Role;

    // Check if the Role reference has changed
    if (beforeData.Role !== newRoleRef) {
      try {
        let newRoleName = null;

        // If the new Role reference exists, fetch the role document
        if (newRoleRef) {
          const roleDoc = await newRoleRef.get();
          if (roleDoc.exists) {
            newRoleName = roleDoc.data().name;
          } else {
            logger.warn(`Role document ${newRoleRef.path} does not exist.`);
          }
        }

        if (newRoleName === 'admin') {
          // Add the 'admin' custom claim
          await admin.auth().setCustomUserClaims(userId, { role: 'admin' });
          logger.info(`Custom claims updated: ${userId} is now an admin.`);
        } else {
          // Remove the 'admin' custom claim (or reset role)
          await admin.auth().setCustomUserClaims(userId, { role: null });
          logger.info(`Custom claims updated: ${userId} is no longer an admin.`);
        }
      } catch (error) {
        logger.error(`Error updating custom claims for ${userId}:`, error);
      }
    }
  });

// Deployment command: firebase deploy --only functions
// Run from the root of the project directory