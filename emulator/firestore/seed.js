// emulator/firestore/seed.js
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

const testEnv = await initializeTestEnvironment({
  projectId: "latertots-a6694",
  firestore: { host: 'localhost', port: 8080 },
});

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await db.collection('users').doc('alice').set({ name: 'Alice' });
});
console.log('Emulator seeded');  
