// backend/mailer.js
const nodemailer = require('nodemailer');
require('dotenv').config();
const logger = require(`./logger`);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // e.g., smtp.smtp2go.com
  port: Number(process.env.SMTP_PORT), // e.g., 587
  secure: false,                     // Use TLS (false for port 587)
  auth: {
    user: process.env.SMTP_USER,     // your SMTP2GO username/email
    pass: process.env.SMTP_PASS,     // your SMTP2GO password
  },
});


//Send an email with an attachment.
//   @param {Object} options
//     - to: recipient(s) as string or array
//     - subject: subject of the email
//     - text: plain text content of the email
//     - html: optional HTML content
//     - pdfBuffer: Buffer containing the PDF
//     - pdfFilename: filename for attachment

async function sendTicketEmail({ to, subject, text, html, pdfBuffer, pdfFilename = 'BusTicket.pdf' }) {
  try {
    const info = await transporter.sendMail({
      from: '"UofCanada Bus Booking" <' + process.env.SMTP_USER + '>',
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    logger.info('Email sent:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
}

module.exports = { sendTicketEmail };
