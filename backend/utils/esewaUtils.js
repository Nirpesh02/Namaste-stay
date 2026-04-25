import crypto from 'crypto';

// eSewa configuration
const ESEWA_CONFIG = {
  test: {
    paymentUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    verifyUrl: 'https://rc-epay.esewa.com.np/api/epay/transaction/status/',
    merchantCode: 'EPAYTEST',
    secretKey: '8gBm/:&EnhH.1/q',
  },
  production: {
    paymentUrl: 'https://epay.esewa.com.np/api/epay/main/v2/form',
    verifyUrl: 'https://epay.esewa.com.np/api/epay/transaction/status/',
    merchantCode: process.env.ESEWA_MERCHANT_CODE || '',
    secretKey: process.env.ESEWA_SECRET_KEY || '',
  },
};

const getConfig = () => {
  const mode = process.env.ESEWA_MODE === 'production' ? 'production' : 'test';
  return ESEWA_CONFIG[mode];
};

/**
 * Generate HMAC-SHA256 signature for eSewa payment
 * The message format is: total_amount,transaction_uuid,product_code
 * IMPORTANT: Amount must be formatted as decimal string matching what's sent to eSewa
 */
export const generateEsewaSignature = (totalAmount, transactionUuid, productCode) => {
  const config = getConfig();
  
  // Format amount as decimal with proper precision
  const amountNum = typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount;
  const amountStr = amountNum.toFixed(2); // Ensure .00 format
  
  const uuidStr = String(transactionUuid).trim();
  const codeStr = String(productCode || config.merchantCode).trim();
  
  // Create the exact message eSewa expects
  const message = `total_amount=${amountStr},transaction_uuid=${uuidStr},product_code=${codeStr}`;
  
  console.log('Signature message:', message);
  console.log('Secret key:', config.secretKey);
  
  const hmac = crypto.createHmac('sha256', config.secretKey);
  hmac.update(message);
  const signature = hmac.digest('base64');
  
  console.log('Generated signature:', signature);
  
  return signature;
};

/**
 * Build the payment form fields for eSewa
 */
export const buildEsewaPaymentFields = ({
  amount,
  taxAmount = 0,
  serviceCharge = 0,
  deliveryCharge = 0,
  transactionUuid,
  productCode,
  successUrl,
  failureUrl,
}) => {
  const config = getConfig();
  const code = productCode || config.merchantCode;
  
  // Ensure all numeric values are properly parsed
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  const taxNum = typeof taxAmount === 'string' ? parseFloat(taxAmount) : taxAmount;
  const chargeNum = typeof serviceCharge === 'string' ? parseFloat(serviceCharge) : serviceCharge;
  const deliveryNum = typeof deliveryCharge === 'string' ? parseFloat(deliveryCharge) : deliveryCharge;
  
  const totalAmount = amountNum + taxNum + chargeNum + deliveryNum;

  // Format amount with .00 for eSewa
  const totalAmountStr = totalAmount.toFixed(2);
  const transactionUuidStr = String(transactionUuid).trim();
  const productCodeStr = String(code).trim();

  // Generate signature using the exact formatted values
  const signature = generateEsewaSignature(totalAmountStr, transactionUuidStr, productCodeStr);

  return {
    amount: amountNum.toFixed(2),
    tax_amount: taxNum.toFixed(2),
    total_amount: totalAmountStr,
    transaction_uuid: transactionUuidStr,
    product_code: productCodeStr,
    product_service_charge: chargeNum.toFixed(2),
    product_delivery_charge: deliveryNum.toFixed(2),
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature,
  };
};

/**
 * Verify eSewa payment by decoding the base64 response data
 */
export const verifyEsewaPayment = (encodedData) => {
  try {
    const decodedString = Buffer.from(encodedData, 'base64').toString('utf-8');
    const data = JSON.parse(decodedString);

    const config = getConfig();

    // The signature in the response is generated using the fields specified in data.signed_field_names
    const signedFieldNames = data.signed_field_names ? data.signed_field_names.split(',') : ['total_amount', 'transaction_uuid', 'product_code'];
    
    const messageParts = signedFieldNames.map(field => {
      const value = data[field] || '';
      return `${field}=${value}`;
    });
    
    const message = messageParts.join(',');

    const hmac = crypto.createHmac('sha256', config.secretKey);
    hmac.update(message);
    const expectedSignature = hmac.digest('base64');

    console.log('Verification Message:', message);
    console.log('Response data:', {
      status: data.status,
      transaction_uuid: data.transaction_uuid,
      received_signature: data.signature,
      expected_signature: expectedSignature,
    });

    if (expectedSignature !== data.signature) {
      console.error('Signature mismatch!');
      return { verified: false, error: 'Signature mismatch', data };
    }

    if (data.status !== 'COMPLETE') {
      return { verified: false, error: `Payment status: ${data.status}`, data };
    }

    return { verified: true, data };
  } catch (error) {
    console.error('Payment verification error:', error);
    return { verified: false, error: error.message, data: null };
  }
};

export const getEsewaPaymentUrl = () => getConfig().paymentUrl;
export const getEsewaMerchantCode = () => getConfig().merchantCode;
