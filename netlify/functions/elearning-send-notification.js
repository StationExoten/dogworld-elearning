const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { type } = data;

        // Configure email transporter
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        let emailOptions = {};

        switch (type) {
            case 'Nuova Richiesta Registrazione E-Learning':
                emailOptions = await handleRegistrationRequest(data, transporter);
                break;
            
            case 'Approvazione Registrazione E-Learning':
                emailOptions = await handleApprovalEmail(data, transporter);
                break;
            
            case 'Rifiuto Registrazione E-Learning':
                emailOptions = await handleRejectionEmail(data, transporter);
                break;
            
            default:
                throw new Error('Tipo di notifica non riconosciuto');
        }

        // Send email
        await transporter.sendMail(emailOptions);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Email inviata con successo' 
            })
        };

    } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Errore nell\'invio dell\'email',
                details: error.message 
            })
        };
    }
};

async function handleRegistrationRequest(data, transporter) {
    const { requestId, userInfo, adminEmails } = data;
    
    const subject = '🎓 Nuova Richiesta Registrazione E-Learning DogWorld';
    
    const htmlContent = `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: linear-gradient(135deg, #003B46, #66A5AD); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🐕 DogWorld E-Learning</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Nuova Richiesta di Registrazione</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #003B46; margin-top: 0;">Dettagli del Richiedente</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 8px 0;"><strong>Nome:</strong> ${userInfo.firstName} ${userInfo.lastName}</p>
                    <p style="margin: 8px 0;"><strong>Email:</strong> ${userInfo.email}</p>
                    <p style="margin: 8px 0;"><strong>Telefono:</strong> ${userInfo.phoneNumber}</p>
                    <p style="margin: 8px 0;"><strong>ID Associato:</strong> ${userInfo.associatedId || 'Non specificato'}</p>
                    <p style="margin: 8px 0;"><strong>ID Richiesta:</strong> ${requestId}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.SITE_URL || 'https://elearning.ilmondodelcane.net'}" 
                       style="background: #66A5AD; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                        🔗 Accedi alla Piattaforma Admin
                    </a>
                </div>
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <p style="margin: 0; color: #1976d2;">
                        <strong>Azione Richiesta:</strong> Accedi alla sezione "Amministrazione" della piattaforma e-learning per approvare o rifiutare questa richiesta.
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
                <p>© 2024 DogWorld - Il Mondo del Cane</p>
                <p>Piattaforma E-Learning Professionale</p>
            </div>
        </div>
    `;

    return {
        from: process.env.SMTP_USER,
        to: adminEmails.join(', '),
        subject: subject,
        html: htmlContent
    };
}

async function handleApprovalEmail(data, transporter) {
    const { recipientEmail, recipientName, loginUrl } = data;
    
    const subject = '🎉 Registrazione Approvata - DogWorld E-Learning';
    
    const htmlContent = `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4caf50, #66bb6a); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">🎉 Benvenuto in DogWorld E-Learning!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">La tua registrazione è stata approvata</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #003B46; margin-top: 0;">Ciao ${recipientName}!</h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                    Siamo felici di informarti che la tua richiesta di accesso alla piattaforma e-learning DogWorld è stata <strong>approvata</strong>! 🎓
                </p>
                
                <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                    <h3 style="margin-top: 0; color: #2e7d32;">Cosa puoi fare ora:</h3>
                    <ul style="color: #2e7d32; margin: 10px 0;">
                        <li>Accedere a tutti i corsi di formazione cinofila</li>
                        <li>Seguire video lezioni professionali</li>
                        <li>Scaricare materiali didattici in PDF</li>
                        <li>Completare quiz interattivi</li>
                        <li>Ottenere certificazioni riconosciute</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" 
                       style="background: #003B46; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
                        🚀 Accedi alla Piattaforma
                    </a>
                </div>
                
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                    <p style="margin: 0; color: #f57c00;">
                        <strong>Suggerimento:</strong> Salva questo link nei tuoi preferiti per accedere facilmente alla piattaforma in futuro.
                    </p>
                </div>
                
                <p style="margin-top: 20px; color: #666;">
                    Se hai domande o hai bisogno di assistenza, non esitare a contattarci all'indirizzo 
                    <a href="mailto:info.ilmondodelcane@gmail.com" style="color: #003B46;">info.ilmondodelcane@gmail.com</a>
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
                <p>© 2024 DogWorld - Il Mondo del Cane</p>
                <p>Piattaforma E-Learning Professionale</p>
                <p><a href="https://ilmondodelcane.net" style="color: #003B46;">ilmondodelcane.net</a></p>
            </div>
        </div>
    `;

    return {
        from: process.env.SMTP_USER,
        to: recipientEmail,
        subject: subject,
        html: htmlContent
    };
}

async function handleRejectionEmail(data, transporter) {
    const { recipientEmail, recipientName, rejectionReason, contactUrl } = data;
    
    const subject = '📋 Aggiornamento Richiesta Registrazione - DogWorld E-Learning';
    
    const htmlContent = `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff9800, #ffb74d); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">📋 DogWorld E-Learning</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Aggiornamento sulla tua richiesta</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #003B46; margin-top: 0;">Ciao ${recipientName},</h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">
                    Grazie per il tuo interesse nella piattaforma e-learning DogWorld. Dopo aver esaminato la tua richiesta di registrazione, 
                    al momento non siamo in grado di approvarla.
                </p>
                
                ${rejectionReason ? `
                <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                    <h3 style="margin-top: 0; color: #f57c00;">Motivo:</h3>
                    <p style="margin: 0; color: #f57c00;">${rejectionReason}</p>
                </div>
                ` : ''}
                
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                    <h3 style="margin-top: 0; color: #1976d2;">Cosa puoi fare:</h3>
                    <ul style="color: #1976d2; margin: 10px 0;">
                        <li>Contattaci per chiarimenti sui requisiti di accesso</li>
                        <li>Verifica che i dati forniti siano corretti e completi</li>
                        <li>Riprova la registrazione in futuro se la situazione cambia</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${contactUrl}" 
                       style="background: #003B46; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                        💬 Contattaci per Assistenza
                    </a>
                </div>
                
                <p style="color: #666;">
                    Siamo sempre disponibili per aiutarti. Puoi contattarci all'indirizzo 
                    <a href="mailto:info.ilmondodelcane@gmail.com" style="color: #003B46;">info.ilmondodelcane@gmail.com</a> 
                    per qualsiasi domanda o chiarimento.
                </p>
                
                <p style="color: #666;">
                    Ti ringraziamo per l'interesse mostrato verso DogWorld e speriamo di poterti accogliere nella nostra community in futuro.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
                <p>© 2024 DogWorld - Il Mondo del Cane</p>
                <p>Piattaforma E-Learning Professionale</p>
                <p><a href="https://ilmondodelcane.net" style="color: #003B46;">ilmondodelcane.net</a></p>
            </div>
        </div>
    `;

    return {
        from: process.env.SMTP_USER,
        to: recipientEmail,
        subject: subject,
        html: htmlContent
    };
}

