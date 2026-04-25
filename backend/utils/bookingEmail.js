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

/**
 * Send booking confirmation email after successful payment
 */
export const sendBookingConfirmationEmail = async ({
  to,
  name,
  bookingDetails,
}) => {
  const missingCredentials = [];
  if (!process.env.EMAIL_USER) missingCredentials.push('EMAIL_USER');
  if (!process.env.EMAIL_PASS) missingCredentials.push('EMAIL_PASS');

  if (missingCredentials.length > 0) {
    console.warn(`Booking email skipped – missing: ${missingCredentials.join(', ')}`);
    return;
  }

  const transporter = getTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || 'Namaste Stay';

  const {
    hotelName,
    roomType,
    checkIn,
    checkOut,
    guests,
    nights,
    totalPrice,
    transactionId,
    district,
    province,
  } = bookingDetails;

  const checkInDate = new Date(checkIn).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const checkOutDate = new Date(checkOut).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Booking Confirmed – ${hotelName}`,
    text: `Hi ${name},\n\nYour booking at ${hotelName} has been confirmed!\n\nDetails:\n- Room: ${roomType}\n- Check-in: ${checkInDate}\n- Check-out: ${checkOutDate}\n- Guests: ${guests}\n- Nights: ${nights}\n- Total: NPR ${totalPrice}\n- Transaction ID: ${transactionId}\n\nThank you for choosing Namaste Stay!`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Namaste Stay</h1>
          <p style="color: #fecaca; margin: 8px 0 0; font-size: 14px;">Booking Confirmation</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px;">Hi <strong>${name}</strong>,</p>
          <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px;">
            Your booking has been <strong style="color: #16a34a;">confirmed</strong>! Here are your reservation details:
          </p>

          <!-- Booking Card -->
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 4px; color: #991b1b; font-size: 20px;">${hotelName}</h2>
            <p style="margin: 0 0 16px; color: #6b7280; font-size: 13px;">📍 ${district}${province ? ', ' + province : ''}</p>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Room Type</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${roomType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Check-in</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${checkInDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Check-out</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${checkOutDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Guests</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${guests}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Nights</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${nights}</td>
              </tr>
              <tr style="border-top: 2px solid #fecaca;">
                <td style="padding: 12px 0 8px; color: #1f2937; font-size: 16px; font-weight: 700;">Total Paid</td>
                <td style="padding: 12px 0 8px; color: #dc2626; font-size: 18px; font-weight: 800; text-align: right;">NPR ${Number(totalPrice).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <!-- Transaction Info -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #166534; font-size: 13px;">
              ✅ <strong>Payment Successful</strong> — Transaction ID: <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px;">${transactionId}</code>
            </p>
          </div>

          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
            Thank you for choosing Namaste Stay. We hope you enjoy your stay!
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© ${new Date().getFullYear()} Namaste Stay. All rights reserved.</p>
        </div>
      </div>
    `,
  });
};
