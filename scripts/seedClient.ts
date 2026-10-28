import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
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
const auth = getAuth(app);

async function seed() {
  const jsonPath = path.resolve(__dirname, 'extractedAssociations.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error("JSON file not found at:", jsonPath);
    process.exit(1);
  }

  let jsonResult;
  try {
    const data = fs.readFileSync(jsonPath, 'utf8');
    jsonResult = JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    process.exit(1);
  }

  console.log(`Read ${jsonResult.length} associations. Seeding Firestore...`);

  const centersCol = collection(db, 'tahfid_centers');
  let addedCount = 0;
  
  for (const assoc of jsonResult) {
    try {
      const docRef = doc(centersCol);
      const centerData = {
        id: docRef.id,
        ...assoc,
        createdBy: "system-scraper-pdf",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(docRef, centerData);
      console.log(`✅ Added: ${assoc.name}`);
      addedCount++;
      // add a small delay to avoid rate limits on free tier
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`❌ Failed to add ${assoc.name}:`, error);
    }
  }
  
  console.log(`\nFinished! Successfully seeded ${addedCount} associations.`);
  process.exit(0);
}

seed();
