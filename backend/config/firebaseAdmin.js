// firebase-admin v10+ uses a modular API — the legacy .apps / .credential
// properties no longer exist on the default export.  Import from the correct
// sub-package paths instead.
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? (() => {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        } catch {
            throw new Error('FIREBASE_SERVICE_ACCOUNT must contain valid JSON')
        }
    })()
    : require(path.join(__dirname, 'firebase-service-account.json'));

// Guard against double-initialisation (e.g. hot-reload in dev)
if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

// Export a thin wrapper so controllers can keep calling admin.auth().verifyIdToken()
module.exports = {
    auth: () => getAuth(),
};
