// Quick test script to send an email
require('dotenv').config();
const { sendMail } = require('./src/services/emailService');

async function testEmail() {
  try {
    console.log('Sending test email to ayesha.khan.ak1905@gmail.com...');
    
    const info = await sendMail({
      to: 'ayesha.khan.ak1905@gmail.com',
      subject: '🎉 Welcome to CRM! Email is working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; border-radius: 8px;">
          <h2 style="color: #333;">Welcome to CRM! 🚀</h2>
          <p style="color: #666; line-height: 1.6;">
            Great news! Your email system is now connected and working perfectly.
          </p>
          <p style="color: #666; line-height: 1.6;">
            This is a test email to confirm your SMTP configuration with SendGrid.
          </p>
          <div style="background: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
            <p style="color: #333; margin: 0;">
              <strong>System Status:</strong> ✅ Email service is operational
            </p>
          </div>
          <p style="color: #999; font-size: 12px;">
            If you received this, your CRM email notifications are ready to go!
          </p>
        </div>
      `,
      text: 'Welcome to CRM! Your email system is working. This is a test email.'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    process.exit(1);
  }
}

testEmail();
