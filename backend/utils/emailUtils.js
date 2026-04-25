import nodemailer from 'nodemailer';

const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendVerificationEmail = async ({ to, name, verificationCode, expiresInMinutes = 15 }) => {
  const missingCredentials = [];
  if (!process.env.EMAIL_USER) missingCredentials.push('EMAIL_USER');
  if (!process.env.EMAIL_PASS) missingCredentials.push('EMAIL_PASS');

  if (missingCredentials.length > 0) {
    throw new Error(`Email credentials are not configured: missing ${missingCredentials.join(', ')}`);
  }

  const transporter = getTransporter();

  const fromName = process.env.EMAIL_FROM_NAME || 'Namaste Stay';
  const subject = 'Verify your Namaste Stay account';
  const message = `Your verification code is ${verificationCode}. It expires in ${expiresInMinutes} minutes.`;

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: `Hi ${name || 'there'},\n\n${message}\n\nIf you did not create this account, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin: 0 0 12px;">Verify your Namaste Stay account</h2>
        <p style="margin: 0 0 12px;">Hi ${name || 'there'},</p>
        <p style="margin: 0 0 16px;">Use the verification code below to activate your account:</p>
        <div style="display: inline-block; padding: 14px 20px; border-radius: 10px; background: #fee2e2; color: #991b1b; font-size: 28px; font-weight: 700; letter-spacing: 6px; margin-bottom: 16px;">${verificationCode}</div>
        <p style="margin: 0 0 12px;">This code expires in ${expiresInMinutes} minutes.</p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
};
