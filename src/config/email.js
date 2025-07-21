const nodemailer = require('nodemailer');

let transporter;

const setupEmail = async () => {
    try {
        // Em produção, usar configurações reais
        if (process.env.NODE_ENV === 'production') {
            transporter = nodemailer.createTransporter({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        } else {
            // Em desenvolvimento, usar Ethereal
            const testAccount = await nodemailer.createTestAccount();
            
            console.log('📧 E-mail de Teste (Ethereal)');
            console.log(`👤 Usuário: ${testAccount.user}`);
            console.log(`🔑 Senha: ${testAccount.pass}`);
            console.log('─────────────────────────────');

            transporter = nodemailer.createTransporter({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        }
        
        console.log('✅ Configuração de e-mail inicializada');
        return true;
    } catch (error) {
        console.error('❌ Falha ao configurar e-mail:', error.message);
        return false;
    }
};

const sendEmail = async (mailOptions) => {
    if (!transporter) {
        console.error('❌ Transportador de e-mail não está pronto');
        return false;
    }
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ E-mail enviado:', info.messageId);
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail:', error.message);
        return false;
    }
};

module.exports = { setupEmail, sendEmail }; 