// Firebase client-side configuration.
// All values come from VITE_FIREBASE_* environment variables in frontend/.env
// Never hard-code API keys here.

import { initializeApp } from 'firebase/app';
import { FacebookAuthProvider, getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingConfig = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

if (missingConfig.length > 0) {
    throw new Error(
        `Missing Firebase configuration: ${missingConfig.join(', ')}. ` +
        'Set the VITE_FIREBASE_* values in frontend/.env and restart Vite.'
    );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
