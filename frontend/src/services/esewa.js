import AuthAPI from './AuthAPI';

/**
 * Initiate eSewa payment for a booking.
 * 1. Calls backend to get eSewa form fields
 * 2. Opens a popup and submits the form to eSewa
 */
export const initiateEsewaPayment = async (token, bookingId) => {
  const clientOrigin = window.location.origin;
  const result = await AuthAPI.initiateEsewaPayment(token, bookingId, clientOrigin);

  if (!result.success) {
    throw new Error(result.message || 'Failed to initiate eSewa payment');
  }

  return result;
};

/**
 * Open an eSewa popup and submit the payment form.
 */
export const openEsewaPopupAndSubmit = ({ paymentUrl, fields, popupRef }) => {
  const popup = popupRef || window.open('about:blank', 'esewa-payment', 'width=620,height=760');

  if (!popup) {
    throw new Error('Popup blocked. Please allow popups to continue payment.');
  }

  const buildInput = (key, value) => {
    const safeKey = String(key).replace(/"/g, '&quot;');
    const safeVal = String(value ?? '').replace(/"/g, '&quot;');
    return `<input type="hidden" name="${safeKey}" value="${safeVal}" />`;
  };

  const inputs = Object.entries(fields || {})
    .map(([key, value]) => buildInput(key, value))
    .join('\n');

  popup.document.open();
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Redirecting to eSewa...</title>
        <style>
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            font-family: 'Inter', Arial, sans-serif;
            background: linear-gradient(135deg, #60b246 0%, #2d8f3c 100%);
            color: white;
          }
          .loader {
            text-align: center;
          }
          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          p { font-size: 18px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <p>Redirecting to eSewa...</p>
        </div>
        <form id="esewaForm" method="POST" action="${paymentUrl}">
          ${inputs}
        </form>
        <script>
          document.getElementById('esewaForm').submit();
        </script>
      </body>
    </html>
  `);
  popup.document.close();

  return popup;
};

/**
 * Redirect the current page to eSewa (full page redirect, no popup).
 */
export const redirectToEsewa = ({ paymentUrl, fields }) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = paymentUrl;

  Object.entries(fields || {}).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(value ?? '');
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

/**
 * Verify eSewa payment using encoded response data.
 */
export const verifyEsewaPayment = async (encodedData, bookingId) => {
  return AuthAPI.verifyEsewaPayment(encodedData, bookingId);
};
