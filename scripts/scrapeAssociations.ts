import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

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

// Initialize Firebase Admin
if (getApps().length === 0) {
  try {
    initializeApp({
      credential: applicationDefault(),
      projectId: config.projectId,
    });
  } catch (error) {
    console.error("Failed to initialize firebase-admin.");
    process.exit(1);
  }
}

const db = getFirestore(config.firestoreDatabaseId || '(default)');

async function processAndSeed() {
  const jsonPath = path.resolve(__dirname, 'extractedAssociations.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error("JSON file not found at:", jsonPath);
    process.exit(1);
  }

  console.log("Reading extractedAssociations.json...");
  let jsonResult;
  try {
    const data = fs.readFileSync(jsonPath, 'utf8');
    jsonResult = JSON.parse(data);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    process.exit(1);
  }

  if (!Array.isArray(jsonResult)) {
    console.error("Data is not an array.");
    process.exit(1);
  }

  console.log(`Read ${jsonResult.length} associations. Seeding Firestore...`);

  const centersCol = db.collection('tahfid_centers');
  let addedCount = 0;
  
  for (const assoc of jsonResult) {
    try {
      const docRef = centersCol.doc();
      const centerData = {
        id: docRef.id,
        ...assoc,
        createdBy: "system-scraper-pdf",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await docRef.set(centerData);
      console.log(`✅ Added: ${assoc.name}`);
      addedCount++;
    } catch (error) {
      console.error(`❌ Failed to add ${assoc.name}:`, error);
    }
  }
  
  console.log(`\nFinished! Successfully seeded ${addedCount} associations.`);
  process.exit(0);
}

processAndSeed();
