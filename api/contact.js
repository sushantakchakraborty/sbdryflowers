// Vercel serverless function - replaces mailvalidation.php
const nodemailer = require('nodemailer');

// ===== Mail settings =====
const SMTP_USERS = ['info.skcinfotech@gmail.com'];
const SMTP_PASS = 'ckkbmyafolcnfkux'; // Gmail App Password (16 letters, bina space)
const MAIL_TO = 'skc.coder@gmail.com';
// =============================================

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbx741MnVxRiGiyKzLSJouAojU2-VcmMlEMtVhQayV9NdUy63VM3PIn8ln1yHGYSnxgy/exec';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function respond(req, res, ok, message, code) {
  const accept = req.headers['accept'] || '';
  const isAjax =
    (req.headers['x-requested-with'] || '').toLowerCase() === 'xmlhttprequest' ||
    (req.body && req.body.ajax === '1') ||
    accept.includes('application/json');

  if (isAjax) {
    return res.status(code).json({ status: ok ? 'success' : 'error', message });
  }
  res.setHeader('Location', `/contact.html?status=${ok ? 'success' : 'error'}`);
  return res.status(303).end();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return respond(req, res, false, 'Invalid request method. Only POST is accepted.', 405);
  }

  let body = req.body || {};
  if (typeof body === 'string') body = Object.fromEntries(new URLSearchParams(body));

  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const requirement = String(body.requirement_type || '').trim().replace(/[\r\n]+/g, ' ');
  const message = String(body.message || '').trim();

  if (!name) return respond(req, res, false, 'Please enter your full name.', 400);
  if (!phone) return respond(req, res, false, 'Please enter your phone number.', 400);
  if (!requirement) return respond(req, res, false, 'Please select your requirement type.', 400);
  if (!message) return respond(req, res, false, 'Please enter your message.', 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond(req, res, false, 'Please enter a valid email address.', 400);
  }
  if (/[\r\n]/.test(name) || /[\r\n]/.test(email)) {
    return respond(req, res, false, 'Invalid characters detected in form submission.', 400);
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: new URLSearchParams({
        domain: req.headers.host || 'Unknown Domain',
        name,
        email: email || 'Not provided',
        phone,
        mobile_no: phone,
        requirement_type: requirement,
        subject: requirement,
        message,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (_) { /* ignore */ }

  const emailText = email || 'Not provided';
  const row = (label, val) =>
    `<tr><td style="padding:8px 0;width:150px;color:#666;font-weight:bold;">${label}</td><td style="padding:8px 0;color:#222;">${esc(val)}</td></tr>`;

  try {
    const mailOptions = {
      from: { name: 'SB Shola Wood Flowers Website', address: SMTP_USERS[0] },
      to: MAIL_TO,
      replyTo: email ? { name, address: email } : undefined,
      subject: 'New Website Enquiry - SB Shola Wood Flowers',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;padding:24px;background:#fff;">
          <div style="border-bottom:2px solid #78472a;padding-bottom:12px;margin-bottom:20px;">
            <h2 style="color:#78472a;margin:0 0 4px 0;font-size:20px;">SB Shola Wood Flowers</h2>
            <span style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">New Website Contact Form Submission</span>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            ${row('Full Name:', name)}${row('Phone Number:', phone)}${row('Email Address:', emailText)}${row('Requirement Type:', requirement)}
          </table>
          <div style="background:#fbf9f6;border-left:4px solid #78472a;padding:16px;border-radius:4px;margin-bottom:20px;">
            <strong style="display:block;color:#78472a;margin-bottom:8px;">Message:</strong>
            <p style="margin:0;color:#333;">${esc(message).replace(/\n/g, '<br>')}</p>
          </div>
          <p style="font-size:12px;color:#999;margin:0;">This inquiry was submitted from the SB Shola Wood Flowers website contact form.</p>
        </div>`,
      text:
        `New Website Enquiry - SB Shola Wood Flowers\n\nFull Name: ${name}\nPhone Number: ${phone}\n` +
        `Email Address: ${emailText}\nRequirement Type: ${requirement}\n\nMessage:\n${message}\n`,
    };

    let lastErr;
    for (const user of SMTP_USERS) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: { user, pass: SMTP_PASS },
        });
        await transporter.sendMail({ ...mailOptions, from: { ...mailOptions.from, address: user } });
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        console.error(`Login/send failed for ${user}:`, e.message);
        if (e.code !== 'EAUTH') break; // sirf login error pe agla account try karo
      }
    }
    if (lastErr) throw lastErr;

    return respond(req, res, true, 'Your enquiry has been sent successfully.', 200);
  } catch (err) {
    console.error('Mail error:', err.message);
    return respond(req, res, false, 'Unable to send enquiry. Please try again later.', 500);
  }
};
