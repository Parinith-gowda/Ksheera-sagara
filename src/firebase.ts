import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    // If it's a permission error, it means we ARE connected but the path is protected (which is expected)
    // If it's an 'offline' error, then the config is likely wrong.
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. The client is offline.");
      } else if (msg.includes('permission-denied') || msg.includes('missing or insufficient permissions')) {
        console.log("Firebase connection verified (received expected permission-denied).");
      } else {
        console.error("Firebase connection test failed:", error.message);
      }
    }
  }
}
testConnection();
