// Simulated email service (ready for real email later)

function sendVerificationCode(email, code) {
  // In production, connect to Resend / EmailJS / Nodemailer here
  console.log('=================================');
  console.log(`VERIFICATION CODE for ${email}`);
  console.log(`Code: ${code}`);
  console.log('=================================');

  return {
    success: true,
    message: 'Verification code sent (check console in development)'
  };
}

module.exports = { sendVerificationCode };
