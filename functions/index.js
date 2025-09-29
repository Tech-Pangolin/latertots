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
const nodemailer = require("nodemailer");
const NotificationSchema = require('./schemas/NotificationSchema');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const _ = require('lodash');

admin.initializeApp();
const db = getFirestore();

const transporter = nodemailer.createTransport({
  service: "gmail", // or another service
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass
  },
});

exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  return db.collection('Users').doc(user.uid).set({
    Email: user.email,
    Role: db.doc('Roles/parent-user'),
    archived: false,
  })
});

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


// Helper function to create notifications
const createNotification = async (notificationData) => {
  try {
    const notification = {
      ...notificationData,
      createdAt: Timestamp.now(),
      expiresAt: notificationData.expiresAt || db.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      )
    };

    // Validate notification data before saving
    const { error, value } = NotificationSchema.validate(notification);
    if (error) {
      logger.error('Notification validation failed:', error.details);
      return;
    }
    
    await db.collection('Notifications').add(value);
  } catch (error) {
    logger.error('Error creating notification:', error);
  }
};

// Notification triggers for admin users

// 1. New reservation requests
exports.createReservationRequestNotification = functions.firestore
  .document('Reservations/{reservationId}')
  .onCreate(async (snapshot, context) => {
    const reservation = snapshot.data();

    if (reservation.extendedProps?.status === 'pending') {
      await createNotification({
        message: `New reservation pending approval for ${reservation.title}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });

// 2. Reservation cancellations
exports.createReservationCancellationNotification = functions.firestore
  .document('Reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== 'cancelled' && 
        after.status === 'cancelled') {
      await createNotification({
        message: `Reservation cancelled by user: ${after.title}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });

// 3. Payment failures
// exports.createPaymentFailureNotification = functions.firestore
//   .document('Reservations/{reservationId}')
//   .onUpdate(async (change, context) => {
//     const before = change.before.data();
//     const after = change.after.data();

//     if (before.extendedProps?.status !== 'unpaid' && 
//         after.extendedProps?.status === 'unpaid') {
//       await createNotification({
//         message: `Payment failed for reservation ${context.params.reservationId} - user ${after.userId}`,
//         type: 'admin',
//         isAdminMessage: true
//       });
//     }
//   });

// 4. User account issues (payment holds)
exports.createUserAccountProblemNotification = functions.firestore
  .document('Users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before.paymentHold && after.paymentHold) {
      await createNotification({
        message: `User account locked due to payment hold: ${after.Email}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });



// 5. Overdue payments (scheduled function) 
// This should probably be an aggregate notification


// exports.createOverduePaymentNotification = functions.pubsub
//   .schedule('every 24 hours')
//   .onRun(async () => {
//     const reservationsRef = db.collection('Reservations');
//     const now = admin.firestore.Timestamp.now();
//     const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
//       new Date(now.toDate().getTime() - 7 * 24 * 60 * 60 * 1000)
//     );

//     const overdueReservations = await reservationsRef
//       .where('extendedProps.status', '==', 'unpaid')
//       .where('end', '<', sevenDaysAgo)
//       .get();

//     for (const doc of overdueReservations.docs) {
//       const reservation = doc.data();
//       const daysOverdue = Math.floor(
//         (now.toDate().getTime() - reservation.end.toDate().getTime()) / (24 * 60 * 60 * 1000)
//       );

//       await createNotification({
//         message: `Payment overdue for ${daysOverdue} days - user ${reservation.userId}`,
//         type: 'admin',
//         isAdminMessage: true
//       });
//     }
//   });

// 6. Refund requests (when status changes to refunded)
// exports.createRefundRequestNotification = functions.firestore
//   .document('Reservations/{reservationId}')
//   .onUpdate(async (change, context) => {
//     const before = change.before.data();
//     const after = change.after.data();

//     if (before.extendedProps?.status !== 'refunded' && 
//         after.extendedProps?.status === 'refunded') {
//       await createNotification({
//         message: `Refund requested for reservation ${context.params.reservationId}`,
//         type: 'admin',
//         isAdminMessage: true
//       });
//     }
//   });

// 7. Capacity warnings (scheduled function)
// exports.createCapacityWarningNotification = functions.pubsub
//   .schedule('every 6 hours')
//   .onRun(async () => {
//     const reservationsRef = db.collection('Reservations');
//     const now = new Date();
//     const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
//     const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

//     // Check capacity for next 2 days
//     for (let checkDate = tomorrow; checkDate <= dayAfter; checkDate.setDate(checkDate.getDate() + 1)) {
//       const startOfDay = admin.firestore.Timestamp.fromDate(new Date(checkDate.setHours(0, 0, 0, 0)));
//       const endOfDay = admin.firestore.Timestamp.fromDate(new Date(checkDate.setHours(23, 59, 59, 999)));

//       const dayReservations = await reservationsRef
//         .where('start', '>=', startOfDay)
//         .where('start', '<=', endOfDay)
//         .where('extendedProps.status', 'in', ['pending', 'confirmed'])
//         .get();

//       // Assuming max capacity of 5 reservations per day (based on existing overlap limit)
//       const capacityPercentage = (dayReservations.size / 5) * 100;

//       if (capacityPercentage >= 80) {
//         await createNotification({
//           message: `Reservation capacity at ${Math.round(capacityPercentage)}% for ${checkDate.toDateString()}`,
//           type: 'admin',
//           isAdminMessage: true
//         });
//       }
//     }
//   });

// Auto-expiration of old notifications
exports.cleanupExpiredNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const notificationsRef = db.collection('Notifications');
    const now = admin.firestore.Timestamp.now();

    const expiredNotifications = await notificationsRef
      .where('expiresAt', '<', now)
      .get();
    
    const batch = db.batch();
    expiredNotifications.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    if (expiredNotifications.size > 0) {
      await batch.commit();
      logger.info(`Cleaned up ${expiredNotifications.size} expired notifications`);
    }
  });

exports.sendContactEmail = functions.https.onRequest(async (req, res) => {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { name, email, subject, message } = req.body;

  const mailOptions = {
    from: functions.config().email.user,
    to: functions.config().email.user,
    subject: subject || "New Contact Form Message",
    text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, message: "Failed to send email" });
  }
});
// Billing Machine HTTP Trigger
const { onRequest } = require('firebase-functions/v2/https');

exports.dailyBillingJob = onRequest(async (req, res) => {
  const logger = require('firebase-functions/logger');
  
  try {
    // Get parameters from query string or environment
    const dryRun = req.query.dryRun === 'true' || process.env.DRY_RUN === 'true';
    const logLevel = req.query.logLevel || process.env.LOG_LEVEL || 'INFO';
    
    logger.info('🚀 [fxn:dailyBillingJob]: Daily billing job triggered via HTTP', {
      timestamp: new Date().toISOString(),
      dryRun,
      logLevel,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url
    });
    
    // Execute billing machine v5
    const { billingMachineV5 } = require('./xstate/indexV5');
    const { createActor } = require('xstate');
    
    // Create and start the v5 actor
    const actor = createActor(billingMachineV5, {
      input: { dryRun }
    }).start();

    // Wait for completion
    await new Promise((resolve, reject) => {
      actor.subscribe((snapshot) => {
        if (snapshot.matches('completedSuccessfully') || snapshot.matches('completedWithProblems')) {
          resolve();
        } else if (snapshot.matches('fatalError') || snapshot.matches('initializationFailed')) {
          reject(new Error('❌ [fxn:dailyBillingJob]: Billing job failed'));
        }
      });
    });
    
    logger.info('🎉 [fxn:dailyBillingJob]: Daily billing job completed successfully', { 
      dryRun,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json({ 
      success: true, 
      dryRun,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ [fxn:dailyBillingJob]: Daily billing job failed', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      dryRun: req.query.dryRun === 'true' || process.env.DRY_RUN === 'true'
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Deployment command: firebase deploy --only functions
// Run from the root of the project directory