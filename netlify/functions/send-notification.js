// netlify/functions/send-notification.js

const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { type, ...data } = JSON.parse(event.body);
    const {
        ADMIN_EMAIL, // L'email da cui invii (es. tuo Gmail)
        EMAIL_PASSWORD, // La password per le app di Gmail
        RECIPIENT_EMAIL // L'email a cui arrivano le notifiche admin
    } = process.env;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: ADMIN_EMAIL,
            pass: EMAIL_PASSWORD,
        },
    });

    let mailOptions;

    try {
        switch (type) {
            case 'new_registration':
                mailOptions = {
                    from: `"Notifiche DogWorld" <${ADMIN_EMAIL}>`,
                    to: RECIPIENT_EMAIL,
                    subject: 'Nuova Richiesta di Iscrizione E-Learning',
                    html: `
                        <h3>Nuova richiesta di iscrizione per la piattaforma E-Learning:</h3>
                        <p><strong>Nome:</strong> ${data.firstName} ${data.lastName}</p>
                        <p><strong>Email:</strong> ${data.email}</p>
                        <p><strong>Telefono:</strong> ${data.phone}</p>
                        <p><strong>ID Associato:</strong> ${data.associatedId || 'Non fornito'}</p>
                        <p>Approva o rifiuta la richiesta dalla pagina Amministrazione.</p>
                    `
                };
                break;

            case 'registration_approved':
                mailOptions = {
                    from: `"DogWorld E-Learning" <${ADMIN_EMAIL}>`,
                    to: data.email,
                    subject: 'La tua richiesta di iscrizione è stata approvata!',
                    html: `
                        <h3>Ciao ${data.firstName},</h3>
                        <p>Siamo felici di comunicarti che la tua richiesta di accesso alla piattaforma E-Learning di DogWorld è stata approvata!</p>
                        <p>La tua password temporanea è: <strong>${data.tempPassword}</strong></p>
                        <p>Ti consigliamo di cambiarla al tuo primo accesso.</p>
                        <p>Puoi accedere alla piattaforma da questo link: <a href="https://URL_DEL_TUO_SITO_ELEARNING">Accedi ora</a></p>
                        <p>Buona formazione!</p>
                    `
                };
                break;

            case 'registration_rejected':
                 mailOptions = {
                    from: `"DogWorld E-Learning" <${ADMIN_EMAIL}>`,
                    to: data.email,
                    subject: 'Informazioni sulla tua richiesta di iscrizione',
                    html: `
                        <h3>Ciao ${data.firstName},</h3>
                        <p>Ti contattiamo in riferimento alla tua richiesta di accesso alla nostra piattaforma E-Learning.</p>
                        <p>Al momento, non è stato possibile approvare la tua richiesta. Per maggiori informazioni o per chiarire la tua posizione, ti invitiamo a contattarci direttamente.</p>
                        <p>Puoi trovare tutti i nostri contatti sul nostro sito web principale: <a href="https://ilmondodelcane.net">www.ilmondodelcane.net</a></p>
                        <p>Grazie per il tuo interesse,<br>Il team di DogWorld</p>
                    `
                };
                break;

            default:
                throw new Error('Tipo di notifica non valido.');
        }

        await transporter.sendMail(mailOptions);
        return { statusCode: 200, body: JSON.stringify({ message: 'Email inviata con successo' }) };

    } catch (error) {
        console.error('Errore invio email:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};