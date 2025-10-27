// emulator/firestore/seed.mjs
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { DateTime, Duration } from 'luxon';
import { config } from 'dotenv';
import ReservationSchema from '../../src/schemas/ReservationSchema.mjs';
import { Timestamp, DocumentReference } from 'firebase/firestore';
import { RESERVATION_STATUS, COLLECTIONS, ROLES, CONTACT_PERMISSIONS, CONTACT_RELATIONS, GENDERS, INVOICE_STATUS } from '../../src/Helpers/constants.mjs';

// Load environment variables from .env file
config();

// Helpers

// not quite 50/50
const flipCoin = () => _.random(10) < 10

// Validation helper for reservations
const validateReservationData = (data) => {
  const { error, value } = ReservationSchema.validate(data, { abortEarly: false });
  if (error) {
    console.error('❌ [emulator/firestore/seed]: Reservation validation failed:', error.details);
    throw new Error(`❌ [emulator/firestore/seed]: Invalid reservation data: ${error.message}`);
  }
  return value;
};
// Format helper: “April 8, 2025” style in America/Denver
function formatDate(dt) {
  return dt.setZone('America/Denver')
           .toLocaleString({ month: 'long', day: 'numeric', year: 'numeric' });
}

// Counter for seeding issues
let issues = 0;

// startEnd: picks a random weekday within ±7 days, a random start between 07:00–19:00 MST/MDT,
// then an end up to 4 hours later.
function startEnd(past = true) {
  // 1. Define your search window in UTC
  const nowUtc = DateTime.utc();
  const windowStart = past
    ? nowUtc.minus({ days: 7 })
    : nowUtc;
  const windowEnd = past
    ? nowUtc
    : nowUtc.plus({ days: 7 });

  
  let dt;
  do {
    const randMillis = faker.date.between({
      from: windowStart.toMillis(),
      to:   windowEnd.toMillis()
    }).getTime();
    dt = DateTime.fromMillis(randMillis, { zone: 'utc' });
  } while (dt.weekday === 6 || dt.weekday === 7); // Luxon: 6=Sat,7=Sun

  const local = dt.setZone('America/Denver').startOf('day')
    .plus({ hours: _.random(7, 19), minutes: _.sample([0,15,30,45]) });

  const maxMs = 4 * 60 * 60 * 1000;
  const offsetMs = Math.random() * maxMs;             // 0 ≤ offsetMs < 4h
  const end = local.plus({ milliseconds: offsetMs });

  return { start: new Date(local), end: new Date(end) };
}

// -------------------------------------------------------

const testEnv = await initializeTestEnvironment({
  projectId: process.env.LATERTOTS_APP_FIREBASE_PROJECT_ID,
  firestore: { host: 'localhost', port: 8080 },
});


await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();

  // Create roles
  for (const role of Object.values(ROLES)) {
    await db.collection(COLLECTIONS.ROLES).doc(role).set({
      "name": role,
      "archived": false
    })
  }

  // Create contact permissions
  for (const perm of Object.values(CONTACT_PERMISSIONS)) {
    await db.collection(COLLECTIONS.PERMISSIONS).doc(perm).set({
      "Description": faker.lorem.sentence({ min: 8, max: 15 })
    })
  }

  // Create children objs
  let childRefs = []
  for (let x = 0; x < 6; x++ ){
    const childRef = db.collection(COLLECTIONS.CHILDREN).doc()
    await childRef.set({
      "Name": faker.person.firstName(),
      "DOB": faker.date.birthdate({max: 12, min: 2, mode: 'age'}),
      "Gender": _.sample(Object.values(GENDERS)),
      "archived": false
    })
    childRefs.push(childRef)
  }

  // Create Contacts
  let contactRefs = []
  for (let x = 0; x < 10; x++) {
    const contactRef = db.collection(COLLECTIONS.CONTACTS).doc()
    await contactRef.set({
      "Name": flipCoin() ? faker.person.fullName() : faker.person.firstName(),
      "Email": flipCoin() ? null : faker.internet.email(),
      "Phone": faker.phone.number({ style: 'national'}),
      "Relation": _.sample(Object.values(CONTACT_RELATIONS)),
      "archived": false
    })
    contactRefs.push(contactRef)
  }

  // Create parent users
  const parentUserRefs = []
  for (let x = 0; x < 6; x++ ){
    const userRef = db.collection(COLLECTIONS.USERS).doc()
    const lastName = faker.person.lastName(); 
    await userRef.set({
      "Name": faker.person.fullName({ lastName: lastName }),
      "Email": faker.internet.email({ lastName: lastName }),
      "CellNumber": faker.phone.number(),                
      "archived": false,                                    // from this point down, properties aren't required
      "Children": childRefs.splice(0,x),                    // splice() changes the source array in place
      "Contacts": _.sampleSize(contactRefs, _.random(5)),
      "City": flipCoin() ? faker.location.city() : null,
      "State": flipCoin() ? faker.location.state() : null,
      "StreetAddress": flipCoin() ? faker.location.streetAddress() : null,
      "Zip": flipCoin() ? faker.location.zipCode() : null,
      "Role": db.collection(COLLECTIONS.ROLES).doc(ROLES.PARENT),
    })
    parentUserRefs.push(userRef)
  }

  // Create a simple admin user
  const adminUserRef = db.collection(COLLECTIONS.USERS).doc('adminTest');
  adminUserRef.set({
    "Name": "Admin User",
    "Email": faker.internet.email({ firstName: 'Admin', lastName: 'User' }),
    "CellNumber": faker.phone.number(),
    "archived": false,
    "Role": db.collection(COLLECTIONS.ROLES).doc(ROLES.ADMIN),
  })

  // ----------------------------------------------------------------------------

  // create reservations
  const parentsWithKidsSnap = await (await db.collection(COLLECTIONS.USERS).where('Children', '!=', []).get()).docs

  for ( let x = 0; x < 15; x++) {
    const parent = _.sample(parentsWithKidsSnap)
    const childRef = _.sample(parent.data().Children)
    const childData = ( await childRef.get()).data()
    const { start, end } = startEnd(_.sample([true, false]))

    const reservRef = db.collection(COLLECTIONS.RESERVATIONS).doc()
    const reservationData = {
      "User": parent.ref,
      "Child": childRef,
      // Persist required and optional fields per ReservationSchema
      "formDraftId": faker.string.uuid(),
      "groupActivity": flipCoin(),
      "archived": false,
      "status": _.sample([RESERVATION_STATUS.PROCESSING, _.sample(Object.values(RESERVATION_STATUS))]),
      "stripePayments": {
        "minimum": null,
        "remainder": null,
        "full": null
      },
      "title": childData.Name,
      "userId": parent.id,
      "start": Timestamp.fromDate(start),
      "end": Timestamp.fromDate(end),
      "childId": childRef.id,
      "status": _.sample([RESERVATION_STATUS.PROCESSING, ...Object.values(RESERVATION_STATUS)]) // give processing a 50% chance for testing
    };

    try {
      const validatedData = validateReservationData(reservationData);
      await reservRef.set(validatedData);
      console.log(`✅ [emulator/firestore/seed]: Created valid reservation: `, {id: reservRef.id, status: validatedData.status});
    } catch (error) {
      console.error(`❌ [emulator/firestore/seed]: Failed to create reservation ${x}:`, error.message);
      issues++;
    }
  }

});

if (issues > 0) {
  console.log(`⚠️ [emulator/firestore/seed]: ${issues} issues were encountered during seeding.`);
} else {
  console.log('🎉 [emulator/firestore/seed]: Emulator seeded with dummy test data.');  
}
