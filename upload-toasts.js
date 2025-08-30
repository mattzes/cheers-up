const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadToasts() {
  try {
    // Read the trinksprüche.json file
    const toastsPath = path.join(__dirname, 'trinksprüche.json');
    const toastsData = fs.readFileSync(toastsPath, 'utf8');
    const toasts = JSON.parse(toastsData);

    console.log(`Found ${toasts.length} toasts to upload...`);

    // Filter out toasts with more than 300 characters
    const filteredToasts = toasts.filter(toast => toast.length <= 300);
    const skippedCount = toasts.length - filteredToasts.length;

    console.log(`Filtered out ${skippedCount} toasts with >300 characters`);
    console.log(`Will upload ${filteredToasts.length} toasts...`);

    // Upload each toast to Firestore
    const toastsCollection = collection(db, 'toasts');
    let uploadedCount = 0;
    let errorCount = 0;

    for (const toastText of filteredToasts) {
      try {
        const toastData = {
          text: toastText,
          likes: 0,
          dislikes: 0,
          createdBy: 'system',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          voteSummary: {
            totalVotes: 0,
          },
        };

        await addDoc(toastsCollection, toastData);
        uploadedCount++;
        console.log(`✓ Uploaded: "${toastText.substring(0, 50)}${toastText.length > 50 ? '...' : ''}"`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error uploading toast: ${error.message}`);
      }
    }

    console.log(`\n=== Upload Complete ===`);
    console.log(`Successfully uploaded: ${uploadedCount} toasts`);
    console.log(`Errors: ${errorCount} toasts`);
    console.log(`Skipped (too long): ${skippedCount} toasts`);
    console.log(`Total processed: ${filteredToasts.length} toasts`);
  } catch (error) {
    console.error('Error reading or parsing trinksprüche.json:', error.message);
    process.exit(1);
  }
}

// Check if environment variables are set
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nPlease set these environment variables before running the script.');
  process.exit(1);
}

// Run the upload
uploadToasts()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
