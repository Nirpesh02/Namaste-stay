# eSewa Payment Integration Guide

This guide explains how the eSewa payment system works in Namaste Stay and how to set it up properly.

## Overview

The payment flow in Namaste Stay uses eSewa as the primary payment gateway. Users can:
1. Create a booking with hotel details
2. Initiate payment through eSewa
3. Get redirected to eSewa for payment entry
4. Return to the app after payment completion/failure
5. See their confirmed booking in the dashboard

## Payment Flow Architecture

### 1. User Booking Creation (Frontend)
```
User fills booking form → Creates booking (status: pending, paymentStatus: pending)
```

### 2. Payment Initiation (Frontend → Backend)
```
POST /api/payments/esewa/initiate
Body: { bookingId, clientOrigin }
Response: { paymentUrl, fields }
```

### 3. Redirect to eSewa (Frontend)
```
Frontend submits form to eSewa with payment fields
eSewa processes payment with user credentials
```

### 4. Payment Verification (eSewa → Backend)
```
Success: Redirects to /payment/success?data=<encoded_response>
Failure: Redirects to /payment/failure?data=<encoded_response>
```

### 5. Booking Confirmation (Frontend → Backend)
```
GET /api/payments/esewa/verify?data=<encoded_response>
Backend verifies signature and updates:
  - booking.status = 'confirmed'
  - booking.paymentStatus = 'completed'
  - transaction.status = 'COMPLETED'
```

## Database Models

### Booking Model
```javascript
{
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'failed',
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded',
  transactionId: 'NS-<bookingId>-<uuid>', // Unique transaction reference
  esewaRefId: '<esewa_transaction_code>' // eSewa's transaction ID
}
```

### Transaction Model
```javascript
{
  booking: ObjectId,
  user: ObjectId,
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
  payment_gateway: 'esewa',
  productId: 'NS-<bookingId>-<uuid>', // Matches booking.transactionId
  transactionCode: '<esewa_transaction_code>',
  esewaRefId: '<esewa_ref_id>',
  verifiedAt: Date,
  amount: Number,
  createdAt: Date
}
```

## Environment Setup

### 1. Create .env file in backend directory
```bash
cp .env.example .env
```

### 2. Configure eSewa
```env
# Test Mode (recommended for development)
ESEWA_MODE=test
# Test credentials are hardcoded in esewaUtils.js

# Production Mode (only after live configuration)
ESEWA_MODE=production
ESEWA_MERCHANT_CODE=your_merchant_code
ESEWA_SECRET_KEY=your_secret_key
```

### 3. Configure Other Variables
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GMAIL_USER=your_email@gmail.com
GMAIL_PASSWORD=your_app_password
```

## Testing the Payment Flow

### Test Mode (Development)
eSewa provides test credentials for testing without real money:
- Merchant Code: `EPAYTEST`
- Secret Key: `8gBm/:&EnhH.1/q`

To test in browser:
1. Navigate to http://localhost:5173
2. Create a booking
3. Click "Confirm Booking" and proceed to payment
4. Use test eSewa credentials (if available)
5. Complete the mock payment
6. Verify the booking shows as "confirmed" in dashboard

### Test Credentials (if using eSewa test portal)
Check eSewa documentation for current test user credentials.

## Key Features Implemented

### ✅ Secure Signature Verification
- HMAC-SHA256 signature for all transactions
- Base64 encoding/decoding for response data
- Cryptographic verification before updating database

### ✅ Error Handling
- Network error recovery with retry logic
- Graceful handling of eSewa response failures
- Email notifications for admins on payment issues

### ✅ Payment Status Tracking
- Pending: Booking created, waiting for payment
- Completed: Payment verified and confirmed
- Failed: Payment cancelled or failed

### ✅ User Experience
- Real-time verification feedback
- Clear error messages
- Automatic booking refresh after successful payment
- Confirmation email sent on success

### ✅ Admin Dashboard
- View all bookings with payment status
- Payment status indicators (Completed, Pending, Failed)
- Transaction tracking in recent bookings

## API Endpoints

### Initiate Payment
```
POST /api/payments/esewa/initiate
Headers: Authorization: Bearer <token>
Body: {
  bookingId: "booking_id",
  clientOrigin: "http://localhost:5173"
}
Response: {
  success: true,
  paymentUrl: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  fields: {
    amount: "1000",
    tax_amount: "0",
    total_amount: "1000",
    transaction_uuid: "NS-<id>-<uuid>",
    product_code: "EPAYTEST",
    signature: "...",
    success_url: "http://localhost:5173/payment/success",
    failure_url: "http://localhost:5173/payment/failure"
  }
}
```

### Verify Payment
```
GET /api/payments/esewa/verify?data=<encoded_response>
Response on Success: {
  success: true,
  message: "Payment verified successfully. Your booking is confirmed!",
  booking: {
    id: "booking_id",
    hotelName: "Hotel Name",
    status: "confirmed",
    paymentStatus: "completed",
    totalPrice: 1000,
    transactionId: "NS-<id>-<uuid>"
  }
}
Response on Failure: {
  success: false,
  message: "Error message"
}
```

### Handle Payment Failure
```
GET /api/payments/esewa/failure?data=<encoded_response>
Response: {
  success: false,
  message: "Payment was cancelled or could not be completed..."
}
```

## Troubleshooting

### Payment Shows as Pending After eSewa Redirect
**Problem**: Payment was completed but booking still shows as pending
**Solution**: 
1. Check eSewa response data is being sent correctly
2. Verify the `data` parameter is URL-encoded properly
3. Check browser console for JavaScript errors
4. Verify backend `/esewa/verify` endpoint is being called

### "Signature Mismatch" Error
**Problem**: Payment verification fails with signature mismatch
**Solution**:
1. Ensure ESEWA_SECRET_KEY matches eSewa configuration
2. Verify the transaction UUID format is correct
3. Check if eSewa mode (test/production) matches your setup

### Booking Shows "Failed" but Should Be "Confirmed"
**Problem**: Payment succeeded but booking status is wrong
**Solution**:
1. Check browser network tab to see if verify endpoint was called
2. Check server logs for verification errors
3. Manually check transaction status in database

### Payment Amount Mismatch
**Problem**: Charged amount differs from booking amount
**Solution**:
1. Verify pricePerNight calculation
2. Check for tax/service/delivery charges being added
3. Confirm eSewa total_amount includes all charges

## Email Notifications

When a payment is successfully verified:
1. **Booking Confirmation Email**: Sent to guest with booking details
2. **Admin Notification** (optional): Can be configured to notify admins

Email template location: `backend/utils/bookingEmail.js`

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **CORS**: Configured to allow requests from frontend domain only
3. **Token Validation**: All endpoints with payment data require authentication
4. **Signature Verification**: All eSewa responses are cryptographically verified
5. **Database Transactions**: Consider using MongoDB transactions for consistency

## Deployment Checklist

- [ ] Update `.env` with production ESEWA_MODE
- [ ] Configure production ESEWA_MERCHANT_CODE and ESEWA_SECRET_KEY
- [ ] Update FRONTEND_URL to production domain
- [ ] Enable HTTPS for all endpoints
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring for failed payments
- [ ] Configure email service for notifications
- [ ] Test booking confirmation email
- [ ] Set up error logging/monitoring

## Support

For eSewa integration issues:
- Check eSewa documentation: https://esewa.com.np
- Review transaction logs in MongoDB
- Check browser console and server logs for detailed errors
- Contact eSewa support with merchant account

## Future Enhancements

- [ ] Add Khalti payment gateway support
- [ ] Implement payment retry logic
- [ ] Add partial refund support
- [ ] Implement payment webhooks for instant verification
- [ ] Add subscription/recurring payment support
- [ ] Multi-currency support
