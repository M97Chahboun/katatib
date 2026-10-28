import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getCountFromServer, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.resolve(__dirname, '../firebase-applet-config.json');

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error("Could not read firebase-applet-config.json", error);
  process.exit(1);
}

const firebaseConfig = {
  apiKey: config.apiKey,
  projectId: config.projectId,
  authDomain: config.authDomain,
  firestoreDatabaseId: config.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

async function initUsersCount() {
  try {
    console.log("Fetching users count...");
    const usersCol = collection(db, 'user_profiles');
    const snapshot = await getCountFromServer(usersCol);
    const count = snapshot.data().count;
    
    console.log(`Found ${count} users. Updating stats/global...`);
    
    const statsDocRef = doc(db, 'stats', 'global');
    await setDoc(statsDocRef, { usersCount: count }, { merge: true });
    
    console.log("✅ Successfully updated global users count!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to initialize users count:", error);
    process.exit(1);
  }
}

initUsersCount();
