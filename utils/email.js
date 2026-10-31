const https = require('https');

async function sendVerificationCode(email, code, name = 'User') {
  const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
  const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

  const data = JSON.stringify({
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id: PUBLIC_KEY,
    accessToken: PRIVATE_KEY,
    template_params: {
      name: name,
      code: code,
      email: email
    }
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.emailjs.com',
      path: '/api/v1.0/email/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`Verification code sent to ${email}`);
          resolve({ success: true });
        } else {
          console.error('EmailJS Error:', body);
          resolve({ success: false, message: body });
        }
      });
    });

    req.on('error', (err) => {
      console.error('Email send error:', err.message);
      resolve({ success: false, message: err.message });
    });

    req.write(data);
    req.end();
  });
}

module.exports = { sendVerificationCode };
