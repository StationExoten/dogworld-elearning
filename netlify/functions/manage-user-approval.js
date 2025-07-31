// netlify/functions/manage-user-approval.js

const admin = require('firebase-admin');

// Inizializza Firebase Admin SDK (richiede variabili d'ambiente)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db = admin.database();
const auth = admin.auth();
const fetch = require('node-fetch');

// Funzione per generare una password casuale
function generatePassword() {
    return Math.random().toString(36).slice(-8);
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        // Verifica il token dell'admin
        const token = event.headers.authorization.split('Bearer ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        const adminEmail = decodedToken.email;

        // Verifica che l'utente sia un admin
        if (!process.env.ADMIN_EMAILS.split(',').includes(adminEmail)) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Accesso negato.' }) };
        }

        const { action, requestId } = JSON.parse(event.body);
        const requestRef = db.ref(`elearningRegistrationRequests/${requestId}`);
        const requestSnapshot = await requestRef.once('value');
        const requestData = requestSnapshot.val();

        if (!requestData || requestData.status !== 'pending') {
            return { statusCode: 400, body: JSON.stringify({ error: 'Richiesta non valida o già processata.' }) };
        }

        if (action === 'approve') {
            const tempPassword = generatePassword();
            
            // 1. Crea utente in Firebase Auth
            const userRecord = await auth.createUser({
                email: requestData.email,
                password: tempPassword,
                displayName: `${requestData.firstName} ${requestData.lastName}`,
            });

            // 2. Crea profilo utente nel Realtime Database
            await db.ref(`elearningUsers/${userRecord.uid}`).set({
                personalInfo: {
                    firstName: requestData.firstName,
                    lastName: requestData.lastName,
                    email: requestData.email,
                    phone: requestData.phone,
                    associatedId: requestData.associatedId || '',
                },
                accountStatus: 'approved',
                createdAt: admin.database.ServerValue.TIMESTAMP,
            });

            // 3. Aggiorna lo stato della richiesta
            await requestRef.update({ status: 'approved' });

            // 4. Invia email di benvenuto
            await fetch(process.env.URL + NETLIFY_FUNCTIONS_URL + 'send-notification', {
                method: 'POST',
                body: JSON.stringify({ type: 'registration_approved', ...requestData, tempPassword }),
            });

        } else if (action === 'reject') {
            await requestRef.update({ status: 'rejected' });
            await fetch(process.env.URL + NETLIFY_FUNCTIONS_URL + 'send-notification', {
                method: 'POST',
                body: JSON.stringify({ type: 'registration_rejected', ...requestData }),
            });
        }

        return { statusCode: 200, body: JSON.stringify({ message: 'Operazione completata con successo.' }) };

    } catch (error) {
        console.error('Errore nella funzione manage-user-approval:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};