import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Nombre del bucket de Google Cloud Storage configurado por el usuario
export const GCS_STORAGE_BUCKET = 'ai-studio-bucket-692554933038-us-east1';
export const GCS_STORAGE_FOLDER = 'documentos_anexos';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore Database with specified databaseId and safe ignoreUndefinedProperties
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(
    app,
    { ignoreUndefinedProperties: true },
    firebaseConfig.firestoreDatabaseId || '(default)'
  );
} catch {
  // If already initialized, retrieve instance
  firestoreDb = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreDb;
export { app };

