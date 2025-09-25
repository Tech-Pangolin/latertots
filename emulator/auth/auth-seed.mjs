// emulator/firestore/auth-seed.mjs
// Authentication seeding script for Firebase Emulator
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase config (same as your main app)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with emulator
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to Auth emulator
import { connectAuthEmulator } from 'firebase/auth';
connectAuthEmulator(auth, 'http://localhost:9099');

// Default test users
const defaultUsers = [
  {
    email: 'admin@ad.min',
    password: 'adminadmin',
    displayName: 'Admin User',
    role: 'admin'
  },
  {
    email: 'user@us.er', 
    password: 'useruser',
    displayName: 'Parent User'
  },
  {
    email: 'test@te.st',
    password: 'testtest', 
    displayName: 'Test User'
  }
];

async function seedAuthUsers() {
  console.log('🌱 Seeding authentication users...');
  
  for (const user of defaultUsers) {
    try {
      // Try to create user (will fail if already exists)
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      console.log(`✅ Created user: ${user.email}`);
      
      // Update display name if provided
      if (user.displayName) {
        await userCredential.user.updateProfile({
          displayName: user.displayName
        });
      }
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  User already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }
  }
  
  console.log('🎉 Authentication seeding complete!');
  console.log('\n📋 Default test accounts:');
  defaultUsers.forEach(user => {
    console.log(`   Email: ${user.email} | Password: ${user.password} | Role: ${user.role}`);
  });
}

// Run the seeding
seedAuthUsers().catch(console.error);
