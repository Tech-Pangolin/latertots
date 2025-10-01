// test-checkout.js - Test script for createCheckoutSession function
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getFunctions } = require('firebase-admin/functions');
const _ = require('lodash');

// Initialize Firebase Admin (for emulator)
initializeApp({
  projectId: 'latertots-a6694'
});

// Configure Firestore to use the emulator
const db = getFirestore();
db.settings({
  host: '127.0.0.1:8080',
  ssl: false
});

// fetch a random user's id from the users collection
const getRandomUserId = async () => {
  const usersSnapshot = await db.collection('Users').get();
  console.log('Available user IDs:', usersSnapshot.docs.map(doc => doc.id));
  const randomDoc = usersSnapshot.docs[Math.floor(Math.random() * usersSnapshot.docs.length)];
  return randomDoc.id; // Use .id to get the document ID
};

// Mock the Firebase Functions call
const testCreateCheckoutSession = async () => {
  try {
    console.log('🧪 Testing createCheckoutSession function...\n');
    
    // Dummy test data
    const testData = {
      reservations: [
        {
          id: 'test-reservation-1',
          childName: 'Emma',
          durationHours: 3,
          groupActivity: true,
          start: '2024-01-15T09:00:00Z',
          end: '2024-01-15T12:00:00Z'
        },
        {
          id: 'test-reservation-2', 
          childName: 'Liam',
          durationHours: 4,
          groupActivity: false,
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T14:00:00Z'
        }
      ],
      paymentType: _.sample(['minimum', 'full']) // or 'full'
    };

    testData.latertotsUserId = await getRandomUserId();
    
    console.log('📋 Test Data:');
    console.log(`- Reservations: ${testData.reservations.length}`);
    console.log(`- Payment Type: ${testData.paymentType}`);
    console.log(`- Latertots User ID: ${testData.latertotsUserId}`);
    console.log(`- Group Activities: ${testData.reservations.filter(r => r.groupActivity).length}\n`);
    
    // Make HTTP request to the emulator function
    const response = await fetch('http://127.0.0.1:5001/latertots-a6694/us-central1/createCheckoutSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('📤 Response Status:', response.status);
    console.log('📤 Response Body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Test PASSED - Checkout session created successfully!');
      console.log(`🔗 Session ID: ${result.sessionId}`);
      console.log(`🌐 Checkout URL: ${result.url}`);
    } else {
      console.log('\n❌ Test FAILED - Error creating checkout session');
      console.log(`🚨 Error:`, result.error);
    }
    
  } catch (error) {
    console.error('\n💥 Test ERROR:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Run the test
console.log('🚀 Starting createCheckoutSession test...\n');
console.log('⚠️  Make sure the Firebase emulator is running!');
console.log('⚠️  Run: npm run start:emulator\n');

testCreateCheckoutSession()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test could not complete:', error);
    process.exit(1);
  });
