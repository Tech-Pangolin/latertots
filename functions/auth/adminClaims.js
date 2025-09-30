const functions = require('firebase-functions/v1');
const logger = require("firebase-functions/logger");
const admin = require('../firebaseInit');
const _ = require('lodash');

exports.updateAdminClaims = functions.firestore
  .document('Users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;

    // Get the previous and new data
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check what's different and skip if no role change
    const differences = _.differenceWith(Object.entries(beforeData), Object.entries(afterData), _.isEqual);
    if (differences.length === 0) {
      logger.info('🔍 [fxn:updateAdminClaims]: No changes detected. Skipping admin claims update.');
      return;
    } else if (differences.length > 0 && !differences.map(([key, value]) => key).includes('Role')) {
      logger.info('🔍 [fxn:updateAdminClaims]: No role change detected. Skipping admin claims update.');
      return;
    }


    // Get the new Role reference
    const newRoleRef = afterData.Role;

    // Check if the Role reference has changed
    if (!_.isEqual(beforeData.Role, newRoleRef)) {
      logger.info(`🔧 [fxn:updateAdminClaims]: Updating admin claims for ${userId}`, { differences });
      try {
        let newRoleName = null;

        // If the new Role reference exists, fetch the role document
        if (newRoleRef) {
          const roleDoc = await newRoleRef.get();
          if (roleDoc.exists) {
            newRoleName = roleDoc.data().name;
          } else {
            logger.warn(`⚠️ [fxn:updateAdminClaims]: Role document ${newRoleRef.path} does not exist.`);
          }
        }

        if (newRoleName === 'admin') {
          // Add the 'admin' custom claim
          await admin.auth().setCustomUserClaims(userId, { role: 'admin' });
          logger.info(`✅ [fxn:updateAdminClaims]: Custom claims updated: ${userId} is now an admin.`);
        } else {
          // Remove the 'admin' custom claim (or reset role)
          await admin.auth().setCustomUserClaims(userId, { role: null });
          logger.info(`✅ [fxn:updateAdminClaims]: Custom claims updated: ${userId} is no longer an admin.`);
        }
      } catch (error) {
        logger.error(`❌ [fxn:updateAdminClaims]: Error updating custom claims for ${userId}:`, error);
      }
    }
  });
