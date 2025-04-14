const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    try {
        console.log(`Attempting to send email to: ${options.to}`);
        
        // Create a transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            debug: true, // Show debug output
            logger: true // Log information about the mail
        });

        // Verify connection configuration
        console.log('Verifying email transporter...');
        await transporter.verify().then(() => {
            console.log('Email server connection verified and ready to send messages');
        }).catch(error => {
            console.error('Email verification error:', error);
            throw new Error(`Email verification failed: ${error.message}`);
        });

        // Define email options
        const mailOptions = {
            from: `Clarity Connect <${process.env.EMAIL_FROM}>`,
            to: options.to,
            subject: options.subject,
            html: options.text,
        };

        // Send email
        console.log('Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return info;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

module.exports = sendEmail; 