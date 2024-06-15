import { app } from "./firebase";
import { getAuth } from "firebase/auth";

const firebaseAuth = getAuth(app);

export { firebaseAuth };