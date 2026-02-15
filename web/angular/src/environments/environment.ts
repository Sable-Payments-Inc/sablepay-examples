// ═══════════════════════════════════════════════════════════════════════════════
// SablePay Example App - Environment Configuration
// ═══════════════════════════════════════════════════════════════════════════════
// Update these with your SablePay credentials.
// Get your credentials from: https://sandbox.sablepay.io
// ═══════════════════════════════════════════════════════════════════════════════

export const environment = {
  production: false,

  // Required: Your SablePay API Key
  // Sandbox format: sable_sk_sand_xxxxx...
  // Production format: sable_sk_live_xxxxx...
  sablepayApiKey: 'sable_sk_sand_hKKTWrlP_9WB-rkHhSvEigghmmHg5-fFYHfyPDMntpM',

  // Required: Your Merchant UUID
  // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  sablepayMerchantId: '79b909ae-b0f1-702b-4a07-b1bcf8e7b7cd',

  // Required: API Base URL
  // Sandbox: https://sandbox-api.sablepay.io/api/v1/
  // Production: https://api.sablepay.io/api/v1/
  sablepayBaseUrl: 'https://sandbox-api.sablepay.io/api/v1/',
};
