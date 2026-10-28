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

async function fixTypo() {
  console.log("Fetching all centers to fix typos...");
  const centersCol = collection(db, 'tahfid_centers');
  const snapshot = await getDocs(centersCol);
  
  let updatedCount = 0;
  
  for (const document of snapshot.docs) {
    try {
      const data = document.data();
      let hasChanges = false;
      const updates: any = {};
      
      // Make absolutely sure it's pending as requested
      if (data.isApproved !== false) {
        updates.isApproved = false;
        hasChanges = true;
      }
      
      // Fix typo in description
      if (data.description && data.description.includes('اإلسالمية')) {
        updates.description = data.description.replace(/اإلسالمية/g, 'الاسلامية');
        hasChanges = true;
      }
      
      // Fix typo in name just in case
      if (data.name && data.name.includes('اإلسالمية')) {
        updates.name = data.name.replace(/اإلسالمية/g, 'الاسلامية');
        hasChanges = true;
      }

      if (hasChanges) {
        const docRef = doc(db, 'tahfid_centers', document.id);
        await updateDoc(docRef, updates);
        console.log(`✅ Fixed typo/status for: ${data.name}`);
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to update ${document.id}:`, error);
    }
  }
  
  console.log(`\nFinished! Successfully updated ${updatedCount} centers.`);
  process.exit(0);
}

fixTypo();
