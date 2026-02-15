
import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const emailTo = 'delivered@resend.dev'; // Resend test email

async function test() {
  console.log('Sending test email...');
  console.log(`From: ${emailFrom}`);
  console.log(`To: ${emailTo}`);
  
  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: emailTo,
      subject: 'JaagrMind Resend Test',
      html: '<strong>It works!</strong><p>This is a test email from JaagrMind backend.</p>',
    });

    if (error) {
      console.error('Error:', error);
    } else {
        console.log('Success!', data);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

test();
