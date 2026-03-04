// Import the Nodemailer library
import nodemailer from 'nodemailer';
import { config } from '../config/env.config';

/**
 * Send an email using Nodemailer
 * @param to Recipient email address
 * @param subject Email subject
 * @param html Email content in HTML format
 * @returns Promise that resolves when the email is sent
 */
export const sendMail = async (
    to: string,
    subject: string,
    html: string
): Promise<any> => {
    // Create a transporter object
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // use false for STARTTLS; true for SSL on port 465
        auth: {
            user: `${config.mail.sender}`,
            pass: `${config.mail.pass}`,
        },
    });

    // Configure the mailoptions object
    const mailOptions = {
        from: `"Eyewear Optic" <${config.mail.sender}>`,
        to: to,
        subject: subject,
        html: html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('[MailUtil] Email sent: ', info.response);
        return info;
    } catch (error) {
        console.error('[MailUtil] Error sending email:', error);
        throw error;
    }
};
