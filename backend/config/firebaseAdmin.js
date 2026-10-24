const admin = require('firebase-admin');
const path = require('path');

// Load the service-account key that already lives in backend/config/
// We never print its contents — we just pass the file path to firebase-admin.
const serviceAccount = require(path.join(__dirname, 'firebase-service-account.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

module.exports = admin;
