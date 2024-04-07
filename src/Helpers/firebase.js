import { collection, getDocs, getDoc } from "@firebase/firestore";
import { db } from "../config/firestore";

async function fetchUserRole(roleRef) {
  const roleSnapshot = await getDoc(roleRef);
  return roleSnapshot.exists() ? roleSnapshot.id : null;
}

export const fetchAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, "Users"));
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    for (const user of users) {
      const roleRef = user.Role;
      user.Role = await fetchUserRole(roleRef);
    }
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};
