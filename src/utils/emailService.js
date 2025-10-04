const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            // host: 'smtp.gmail.com',
            service: 'gmail', // Optional, if using a service like Gmail
            // port: 465,
            // secure: false,
            auth: {
                // user: process.env.SMTP_USER,
                // pass: process.env.SMTP_PASS
                user: 'arifishtiaque.sparktech@gmail.com',
                pass: 'etnynjlbjeongxfe'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

    }
    // Template for OTP email
    generateOTPTemplate(otp, userName = '') {
        return {
            subject: 'Code de vérification pour réinitialiser votre mot de passe',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Code de vérification pour réinitialiser votre mot de passe</h2>
          ${userName ? `<p>Hello ${userName},</p>` : '<p>Hello,</p>'}
          <p>Vous avez demandé à réinitialiser votre mot de passe. Veuillez utiliser le code de vérification suivant pour procéder:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>Ce code expirera dans 15 minutes.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation de mot de passe, veuillez ignorer ce courriel ou contacter le support si vous avez des préoccupations.</p>
          <p style="color: #666; margin-top: 20px;">Cordialement,<br>Team Many Stack</p>
        </div>
      `
        };
    }
    // Send email method
    async sendEmail(to, template) {
        // console.log('Sending email to:', to);
        try {
            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
                to: to,
                subject: template.subject,
                html: template.html
            };

            const info = await this.transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
            throw error;
        }
    }

    // Specific method for sending OTP
    async sendOTP(email, otp, userName = '') {
        const template = this.generateOTPTemplate(otp, userName);
        return this.sendEmail(email, template);
    }
}

module.exports = new EmailService();