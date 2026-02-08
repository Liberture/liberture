/**
 * Test script to send a sample email using Resend
 * 
 * Usage:
 *   npx tsx scripts/test-email.ts
 */

import { sendWelcomeEmail } from '../lib/resend';

async function testEmail() {
  console.log('🧪 Testing Resend email integration...\n');

  try {
    // Replace with a real email address to test
    const testEmail = 'leon@liberture.com'; // Change this!
    const testName = 'Leon';

    console.log(`📧 Sending welcome email to: ${testEmail}`);

    const result = await sendWelcomeEmail(testEmail, testName);

    console.log('\n✅ Email sent successfully!');
    console.log('Response:', result);
  } catch (error) {
    console.error('\n❌ Failed to send email:');
    console.error(error);
    process.exit(1);
  }
}

testEmail();
