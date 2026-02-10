// import nodemailer from 'nodemailer';
const nodemailer = require('nodemailer');

// // TESTING ONLY
// const dotenv = require('dotenv');
// dotenv.config();


const DOMAIN = process.env.DOMAIN;
const PROJECT_NAME = process.env.PROJECT_NAME || 'SUPER APP';
const EMAIL_SMTP_HOST = process.env.EMAIL_SMTP_HOST;
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// console.log('DOMAIN:', DOMAIN);
// console.log('EMAIL_SMTP_HOST:', EMAIL_SMTP_HOST);
// console.log('EMAIL_ADDRESS:', EMAIL_ADDRESS);
// console.log('EMAIL_PASSWORD:', EMAIL_PASSWORD ? '********' : 'Not Set');


const sendEmail = async ({ sendTo, subject, title, elements = [], html = '' }) => {
    try {
        const transporter = nodemailer.createTransport({
            // service: 'Gmail', // e.g., 'Gmail', 'Outlook', 'SMTP server hostname', etc.
            host: EMAIL_SMTP_HOST,
            port: 465,
            secure: true,
            auth: {
                user: EMAIL_ADDRESS,
                pass: EMAIL_PASSWORD,
            },
        });

        const thisYear = new Date().getFullYear();

        // Email data
        const mailOptions = {
            from: EMAIL_ADDRESS,
            to: sendTo,
            subject: subject || 'Untitled Subject',
            html: html || `
            <html>
            <head>
                <title>${title}</title>
            </head>
            <body>
                <header>
                    <font color="#000000"><h2>${title}</h2></font>
                </header>
                <main>
                    <font color="#000000">${elements.join('')}</font>
                </main>
                <footer>
                    <div class="footer" style="color: #b8b8b8; padding: 10px;margin-top:18px; text-align: start; border-top: 1px solid #b8b8b8">
                        <p>Copyright © 2021-${thisYear}, ${PROJECT_NAME || ''}</p>
                    </div>
                </footer>
            </body>
            </html>
        `
        };


        //     const mailOptions = {
        //         from: '',
        //         to: '',
        //         subject: '',
        //         html: `
        //     <html>
        //     <head>
        //         <title>Test HTML TITLE</title>
        //     </head>
        //     <body>
        //         <header>
        //             <font color="#000000"><h2>test h2 title</h2></font>
        //         </header>
        //         <main>
        //             <font color="#000000">${elements.join('')} [elements array]</font>
        //         </main>
        //         <footer>
        //             <div class="footer" style="color: #b8b8b8; padding: 10px;margin-top:18px; text-align: start; border-top: 1px solid #b8b8b8">
        //                 <p>Copyright © 2021-${thisYear}, ${DOMAIN}</p>
        //             </div>
        //         </footer>
        //     </body>
        //     </html>
        // `
        //     };


        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                // console.error('Error sending email:', error);
            } else {
                // console.log('Email sent:', info.response);
            }
        });

    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// sendEmail({
//     sendTo: 'skarpioners1@gmail.com',
//     title: 'Please confirm your email',
//     subject: 'Thank you for signing up !',
//     elements: [
//         `<p>Thank you for signing up !</p>`,
//         `<p>Please confirm your email by clicking the button below to activate your account</p>`,
//         `<p></p>`,
//         `<a href="example.com" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Activate Account</a>`,
//         `<p></p>`,
//         `<p>Link is active for 2 days</p>`,
//         `<p></p>`,
//         `<p></p>`,
//     ]
// })

export default sendEmail;
