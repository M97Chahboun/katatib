import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, getDocs, collection } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('./scripts/firebase-config.json', 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const uid = "Yn6VDRhPVwPnwe2e8zWjIHUf0Vn1";
  const docRef = doc(db, "user_profiles", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    console.log("Document data:", docSnap.data());
  } else {
    console.log("No such document!");
  }
  
  const snap = await getDocs(collection(db, "user_profiles"));
  console.log("Total user_profiles:", snap.size);
  snap.forEach(d => {
    console.log(d.id, d.data().displayName);
  });
  
  process.exit(0);
}

check();
