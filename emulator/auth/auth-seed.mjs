// emulator/auth/auth-seed.mjs
// Authentication seeding script for Firebase Emulator
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator, updateProfile } from 'firebase/auth';
import { config } from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables from .env file
config();

// Reset auth emulator data first
async function resetAuthEmulator() {
  try {
    console.log('🗑️  Resetting auth emulator data...');
    const projectId = process.env.LATERTOTS_APP_FIREBASE_PROJECT_ID;
    const command = `curl -H 'Authorization: Bearer owner' -X DELETE http://localhost:9099/emulator/v1/projects/${projectId}/accounts`;
    execSync(command, { stdio: 'pipe' });
    console.log('✅ Auth emulator data reset successfully');
  } catch (error) {
    console.log('⚠️  Auth emulator reset failed (this is normal if emulator is not running):', error.message);
  }
}

// Firebase config (same as your main app)
const firebaseConfig = {
  apiKey: process.env.LATERTOTS_APP_FIREBASE_API_KEY,
  authDomain: process.env.LATERTOTS_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.LATERTOTS_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.LATERTOTS_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.LATERTOTS_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.LATERTOTS_APP_FIREBASE_APP_ID,
  measurementId: process.env.LATERTOTS_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with emulator
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Connect to Auth emulator
try {
  connectAuthEmulator(auth, 'http://localhost:9099');
} catch (error) {
  if (!error.message.includes('already been called')) {
    console.warn('⚠️  Auth emulator connection warning:', error.message);
  }
}

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
  
  // Reset auth emulator data first
  await resetAuthEmulator();
  
  for (const user of defaultUsers) {
    try {
      // Create user (fresh start after reset)
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      console.log(`✅ Created user: ${user.email}`);
      
      // Update display name if provided
      if (user.displayName) {
        await updateProfile(userCredential.user, {
          displayName: user.displayName
        });
      }
      
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
    }
  }
  
  console.log('🎉 Authentication seeding complete!');
  console.log('\n📋 Default test accounts:');
  defaultUsers.forEach(user => {
    console.log(`   Email: ${user.email} | Password: ${user.password} | Role: ${user.role || 'parent'}`);
  });
}

// Run the seeding
seedAuthUsers().catch(console.error);
