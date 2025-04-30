// emulator/firestore/seed.js
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { faker } from '@faker-js/faker';
import _ from 'lodash'
import { DateTime, Duration } from 'luxon'

// Helpers

// not quite 50/50
const flipCoin = () => _.random(10) < 6

// Format helper: “April 8, 2025” style in America/Denver
function formatDate(dt) {
  return dt.setZone('America/Denver')
           .toLocaleString({ month: 'long', day: 'numeric', year: 'numeric' });
}

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

  // 2. Pick a random weekday within that window
  let dt;
  do {
    const randMillis = faker.date.between({
      from: windowStart.toMillis(),
      to:   windowEnd.toMillis()
    }).getTime();
    dt = DateTime.fromMillis(randMillis, { zone: 'utc' });
  } while (dt.weekday === 6 || dt.weekday === 7); // Luxon: 6=Sat,7=Sun

  // 3. Snap to UTC–6 date and set a random hour/minute in that zone
  const local = dt.setZone('America/Denver').startOf('day')
    .plus({ hours: _.random(7, 19), minutes: _.sample([0,15,30,45]) });

  // Generate offset in milliseconds up to 4 hours
  const maxMs = 4 * 60 * 60 * 1000;
  const offsetMs = Math.random() * maxMs;             // 0 ≤ offsetMs < 4h
  const end = local.plus({ milliseconds: offsetMs });


  console.log('fullDate:', formatDate(local));
  console.log('start  :', local.toISO()); // e.g. 2025-04-30T08:15:00.000-06:00
  console.log('end    :', end.toISO());   // within 4h

  return { start: new Date(local), end: new Date(end) };
}

// -------------------------------------------------------

const testEnv = await initializeTestEnvironment({
  projectId: "latertots-a6694",
  firestore: { host: 'localhost', port: 8080 },
});


await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();

  // Create roles
  for (const role of ['admin', 'parent-user']) {
    await db.collection('Roles').doc(role).set({
      "name": role,
      "archived": false
    })
  }

  // Create contact permissions
  for (const perm of ['Make_Contact_To_Child', 'Medical_Aid', 'Pickup', 'Receive_Contact_From_Child']) {
    await db.collection('Parent_Authorized_Permissions').doc(perm).set({
      "Description": faker.lorem.sentence({ min: 8, max: 15 })
    })
  }


  // Create children objs
  let childRefs = []
  for (let x = 0; x < 6; x++ ){
    const childRef = db.collection('Children').doc()
    await childRef.set({
      "Name": faker.person.firstName(),
      "DOB": faker.date.birthdate({max: 12, min: 2, mode: 'age'}),
      "Gender": _.sample(['male', 'female', 'other']),
      "archived": false
    })
    childRefs.push(childRef)
  }
  console.log("Child refs:", childRefs.length)

  // Create Contacts
  let contactRefs = []
  for (let x = 0; x < 10; x++) {
    const contactRef = db.collection('Contacts').doc()
    await contactRef.set({
      "Name": flipCoin() ? faker.person.fullName() : faker.person.firstName(),
      "Email": flipCoin() ? null : faker.internet.email(),
      "Phone": faker.phone.number({ style: 'national'}),
      "Relation": _.sample(["Family", "Friend", "Parent", "Doctor"]),
      "archived": "false"
    })
    contactRefs.push(contactRef)
  }
  console.log("Contact refs:", contactRefs.length)

  // Create parent users
  const parentUserRefs = []
  for (let x = 0; x < 4; x++ ){
    const userRef = db.collection('Users').doc()
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
      "Zip": flipCoin() ? faker.location.zipCode() : null
    })
    parentUserRefs.push(userRef)
  }
  console.log("Parent User refs:", parentUserRefs.length)

  // ----------------------------------------------------------------------------

  // create reservations
  const parentsWithKidsSnap = await (await db.collection('Users').where('Children', '!=', []).get()).docs

  for ( let x = 0; x < 4; x++) {
    const parent = _.sample(parentsWithKidsSnap)
    const childRef = _.sample(parent.data().Children)
    const childData = ( await childRef.get()).data()
    const { start, end } = startEnd()

    const reservRef = db.collection('Reservations').doc()
    await reservRef.set({
      "User": parent.ref,
      "Child": childRef,
      "allDay": false,
      "archived": false,
      "locked": flipCoin(),
      "title": childData.Name,
      "userId": parent.id,
      "start": start,
      "end": end,
      "extendedProps": {
        "childId": childRef.id,
        "status": _.sample(["pending", "unpaid", "paid", "confirmed", "cancelled", "late"]),
        "fromForm": flipCoin()
      }
    })
  }

});
console.log('Emulator seeded');  
