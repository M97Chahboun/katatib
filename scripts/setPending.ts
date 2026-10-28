import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

async function setAllPending() {
  console.log("Fetching all centers...");
  const centersCol = collection(db, 'tahfid_centers');
  const snapshot = await getDocs(centersCol);
  
  let updatedCount = 0;
  
  for (const document of snapshot.docs) {
    try {
      const docRef = doc(db, 'tahfid_centers', document.id);
      await updateDoc(docRef, { isApproved: false });
      console.log(`✅ Set pending: ${document.data().name}`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Failed to update ${document.id}:`, error);
    }
  }
  
  console.log(`\nFinished! Successfully set ${updatedCount} centers to pending status.`);
  process.exit(0);
}

setAllPending();
