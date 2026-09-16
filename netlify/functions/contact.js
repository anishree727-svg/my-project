const nodemailer = require('nodemailer');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed. Use POST.' })
    };
  }

  let data = {};
  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
    if (contentType.includes('application/json')) {
      data = JSON.parse(event.body || '{}');
    } else {
      const params = new URLSearchParams(event.body || '');
      data = Object.fromEntries(params.entries());
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Malformed request payload.' })
    };
  }

  // Honeypot spam check
  if (data['bot-field'] || data['botField'] || data['_gotcha']) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Enquiry received.' })
    };
  }

  const name = (data.name || '').trim();
  const email = (data.email || '').trim();
  const requirement = (data.requirement || '').trim();
  const message = (data.message || '').trim();

  if (!name || name.length < 2) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Please enter your full name.' })
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Please enter a valid work email address.' })
    };
  }

  const toEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.TO_EMAIL || 'info@theteagroimpex.com';
  const subject = `New Agro Export Enquiry: ${name}${requirement ? ' - ' + requirement : ''}`;
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const textBody = `
New enquiry received from theteagroimpex.in website:
--------------------------------------------------
Sender Name: ${name}
Work Email: ${email}
Produce / Requirement: ${requirement || 'General enquiry'}
Message:
${message || 'No additional message provided.'}

Received: ${timestamp} IST
Recipient: ${toEmail}
--------------------------------------------------
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f5eb; margin: 0; padding: 24px; color: #16291f; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #dce3d5; overflow: hidden; box-shadow: 0 10px 30px rgba(18,61,44,0.06); }
    .header { background: #123d2c; padding: 28px; color: #f4f5eb; }
    .header .eyebrow { color: #b8d57a; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; margin: 0 0 8px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #d9ed9d; }
    .content { padding: 32px 28px; }
    .row { margin-bottom: 22px; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #68776d; display: block; margin-bottom: 6px; }
    .value { font-size: 15px; font-weight: 500; color: #123d2c; }
    .value a { color: #1f5940; text-decoration: underline; font-weight: 600; }
    .box { background: #fbfcf7; border: 1px solid #dce3d5; border-radius: 10px; padding: 16px; margin-top: 6px; font-size: 14px; line-height: 1.6; color: #16291f; white-space: pre-wrap; }
    .footer { background: #f4f5eb; padding: 18px 28px; font-size: 11px; color: #68776d; border-top: 1px solid #dce3d5; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="eyebrow">Thete Agro Impex · Sourcing Desk</div>
      <h1>New Agro Export Enquiry</h1>
    </div>
    <div class="content">
      <div class="row">
        <span class="label">Sender Name</span>
        <div class="value">${escapeHtml(name)}</div>
      </div>
      <div class="row">
        <span class="label">Work Email</span>
        <div class="value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
      </div>
      <div class="row">
        <span class="label">Produce / Requirement</span>
        <div class="value">${escapeHtml(requirement || 'General enquiry')}</div>
      </div>
      <div class="row">
        <span class="label">Message</span>
        <div class="box">${escapeHtml(message || 'No additional message provided.')}</div>
      </div>
    </div>
    <div class="footer">
      <span>Time: ${timestamp} IST</span>
      <span>Source: theteagroimpex.in</span>
    </div>
  </div>
</body>
</html>
`.trim();

  try {
    // 1. RESEND API (Recommended for modern Netlify setups)
    if (process.env.RESEND_API_KEY) {
      const fromEmail = process.env.FROM_EMAIL || 'Thete Agro Impex <enquiry@theteagroimpex.in>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: email,
          subject: subject,
          html: htmlBody,
          text: textBody
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error('Resend delivery error:', errJson);
        throw new Error(errJson.message || `Resend HTTP error ${res.status}`);
      }

      const resData = await res.json().catch(() => ({}));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Thank you! Your enquiry has been sent to our team.',
          id: resData.id
        })
      };
    }

    // 2. BREVO / SENDINBLUE API
    if (process.env.BREVO_API_KEY) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Thete Agro Impex Website', email: process.env.FROM_EMAIL || 'info@theteagroimpex.com' },
          to: [{ email: toEmail, name: 'Thete Agro Impex Team' }],
          replyTo: { email: email, name: name },
          subject: subject,
          htmlContent: htmlBody,
          textContent: textBody
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        console.error('Brevo delivery error:', errJson);
        throw new Error(errJson.message || `Brevo HTTP error ${res.status}`);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Thank you! Your enquiry has been sent to our team.'
        })
      };
    }

    // 3. SENDGRID API
    if (process.env.SENDGRID_API_KEY) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: process.env.FROM_EMAIL || 'info@theteagroimpex.com', name: 'Thete Agro Impex' },
          reply_to: { email: email, name: name },
          subject: subject,
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody }
          ]
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('SendGrid delivery error:', errText);
        throw new Error(`SendGrid HTTP error ${res.status}`);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Thank you! Your enquiry has been sent to our team.'
        })
      };
    }

    // 4. SMTP / NODEMAILER (Works with Gmail, Zoho, Outlook, Hostinger, cPanel webmail, etc.)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = Number(process.env.SMTP_PORT) || 465;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: `"${name} (Website Enquiry)" <${process.env.SMTP_USER}>`,
        to: toEmail,
        replyTo: email,
        subject: subject,
        text: textBody,
        html: htmlBody
      });

      console.log('SMTP email sent successfully:', info.messageId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Thank you! Your enquiry has been sent to our team.'
        })
      };
    }

    // 5. DEVELOPMENT / ETHEREAL FALLBACK (When no live credentials are set)
    console.log('No production email credentials detected in environment variables. Using Ethereal SMTP test service...');
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const testInfo = await testTransporter.sendMail({
      from: `"${name} (Website Enquiry)" <${testAccount.user}>`,
      to: toEmail,
      replyTo: email,
      subject: subject,
      text: textBody,
      html: htmlBody
    });

    const previewUrl = nodemailer.getTestMessageUrl(testInfo);
    console.log('✓ Test email dispatched via Ethereal SMTP!');
    console.log('✓ Message ID:', testInfo.messageId);
    console.log('✓ View email rendered in browser:', previewUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Thank you! Your enquiry has been sent to our team.',
        previewUrl: previewUrl
      })
    };

  } catch (deliveryError) {
    console.error('Email transmission failed:', deliveryError);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Unable to send enquiry at this time. Please email info@theteagroimpex.com directly.'
      })
    };
  }
};
