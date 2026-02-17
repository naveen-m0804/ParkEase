// =============================================
// ParkEase - Firebase Admin SDK Initialization
// =============================================
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const config = require('./index');

let firebaseApp;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    let credential;

    // Option A: Service account JSON file
    if (config.firebase.serviceAccountPath) {
      const absolutePath = path.resolve(config.firebase.serviceAccountPath);

      if (fs.existsSync(absolutePath)) {
        const serviceAccount = require(absolutePath);
        credential = admin.credential.cert(serviceAccount);
        console.log('🔥 Firebase initialized from service account file');
      } else {
        console.warn(`⚠️  Firebase service account file not found at: ${absolutePath}`);
      }
    }

    // Option B: Individual environment variables
    if (!credential && config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      credential = admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      });
      console.log('🔥 Firebase initialized from environment variables');
    }

    if (!credential) {
      console.warn('⚠️  Firebase credentials not configured. Auth middleware will reject all requests.');
      return null;
    }

    firebaseApp = admin.initializeApp({ credential });
    return firebaseApp;
  } catch (err) {
    console.error('❌ Firebase initialization error:', err.message);
    return null;
  }
};

/**
 * Verify a Firebase ID token
 * @param {string} idToken - The Firebase ID token from client
 * @returns {Promise<object>} Decoded token with uid, email, etc.
 */
const verifyIdToken = async (idToken) => {
  if (!firebaseApp) {
    throw new Error('Firebase is not initialized');
  }
  return admin.auth().verifyIdToken(idToken);
};

/**
 * Delete a Firebase user by UID
 * @param {string} uid - Firebase UID
 */
const deleteFirebaseUser = async (uid) => {
  if (!firebaseApp) {
    throw new Error('Firebase is not initialized');
  }
  return admin.auth().deleteUser(uid);
};

module.exports = { initializeFirebase, verifyIdToken, deleteFirebaseUser };
