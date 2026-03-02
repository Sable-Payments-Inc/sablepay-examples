// ═══════════════════════════════════════════════════════════════════════════════
// SablePay React Native Example App - Environment Configuration
// ═══════════════════════════════════════════════════════════════════════════════
// Values are loaded from the .env.example file in the example-app root.
// Update .env.example with your credentials.
// Get your credentials from: https://sandbox.sablepay.io
// ═══════════════════════════════════════════════════════════════════════════════

import {
  SABLEPAY_API_KEY,
  SABLEPAY_MERCHANT_ID,
  SABLEPAY_BASE_URL,
  PRODUCTION,
} from '@env';

const environment = {
  production: PRODUCTION === 'true',

  // Required: Your SablePay API Key
  sablepayApiKey: SABLEPAY_API_KEY,

  // Required: Your Merchant UUID
  sablepayMerchantId: SABLEPAY_MERCHANT_ID,

  // Required: API Base URL
  sablepayBaseUrl: SABLEPAY_BASE_URL,
};

export default environment;
