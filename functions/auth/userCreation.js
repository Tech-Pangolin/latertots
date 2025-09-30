const functions = require('firebase-functions/v1');
const admin = require('../firebaseInit');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  return db.collection('Users').doc(user.uid).set({
    Email: user.email,
    Role: db.doc('Roles/parent-user'),
    archived: false,
  })
});
