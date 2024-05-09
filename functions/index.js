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
const db = admin.firestore();

exports.validateNewUser = functions.firestore
    .document('Users/{docId}')
    .onCreate((snap, context) => {
        // Get the current data
        const receivedData = snap.data();

        // Populate the standard data shape
        const newValidUser = {
            CellNumber: "",
            City: "",
            Email: receivedData.email,
            Name: receivedData.displayName || "",
            Role: db.collection('Roles').doc('parent-user'),
            State: "",
            StreetAddress: "",
            Zip: ""
        };

        // Save the updated document
        return snap.ref.set(newValidUser, { merge: false }).then(() => {
          logger.info(`Success: Document (Users/${context.params.docId}) updated`);
        }).catch((error) => {
          logger.error(`Error updating document (Users/${context.params.docId}):`, error);
        }); 
    });

// Deployment command: firebase deploy --only functions
// Run from the root of the project directory