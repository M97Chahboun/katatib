import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
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

async function deleteSeededCenters() {
  console.log("Fetching seeded centers to delete...");
  const centersCol = collection(db, 'tahfid_centers');
  
  // Find all centers created by the scraper script
  const q = query(centersCol, where('createdBy', '==', 'system-scraper-pdf'));
  const snapshot = await getDocs(q);
  
  let deletedCount = 0;
  
  for (const document of snapshot.docs) {
    try {
      const docRef = doc(db, 'tahfid_centers', document.id);
      await deleteDoc(docRef);
      console.log(`🗑️ Deleted: ${document.data().name}`);
      deletedCount++;
    } catch (error) {
      console.error(`❌ Failed to delete ${document.id}:`, error);
    }
  }
  
  console.log(`\nFinished! Successfully deleted ${deletedCount} seeded centers.`);
  process.exit(0);
}

deleteSeededCenters();
