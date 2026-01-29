// Import the Nodemailer library
import nodemailer from 'nodemailer';
import { config } from '../config/env.config';

export const sendMail = (to : string, subject: string, html: string) => {
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use false for STARTTLS; true for SSL on port 465
    auth: {
      user: `${config.mail.sender}`,
      pass: `${config.mail.pass}`,
    }
  });

  // Configure the mailoptions object
  const mailOptions = {
    from: `${config.mail.sender}`,
    to: to,
    subject: subject,
    html: html, 
  };

  // Send the email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent: ', info.response);
    }
  });
}