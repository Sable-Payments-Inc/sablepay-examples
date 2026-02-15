# SablePay SDK Examples

[![Build](https://github.com/AshishPal04/sablepay-examples/actions/workflows/build.yml/badge.svg)](https://github.com/AshishPal04/sablepay-examples/actions/workflows/build.yml)

Integration examples for SablePay SDKs across multiple platforms.

## Available Examples

| Platform | Status | Directory | Documentation |
|----------|--------|-----------|---------------|
| **Android** | ✅ Available | [/android](./android) | [Android Guide](./android/README.md) |
| **Web (React)** | ✅ Available | [/web/react](./web/react) | [React Guide](./web/react/README.md) |
| **Web (Angular)** | ✅ Available | [/web/angular](./web/angular) | [Angular Guide](./web/angular/README.md) |
| **Flutter** | 📜 Coming Soon | [/flutter](./flutter) | - |

---

## Quick Start

### Android

```bash
cd android
cp local.properties.example local.properties
# Edit local.properties with your credentials
./gradlew installDebug
```

### Web (React / Next.js)

```bash
cd web/react
npm install
# Create .env.local with your credentials (see below)
npm run dev
```

Create `web/react/.env.local`:
```env
PUBLIC_SABLEPAY_API_KEY=sable_sk_sand_YOUR_API_KEY
PUBLIC_SABLEPAY_MERCHANT_ID=00000000-0000-0000-0000-000000000000
PUBLIC_SABLEPAY_BASE_URL=https://sandbox-api.sablepay.io
```

### Web (Angular)

```bash
cd web/angular
npm install
# Edit src/environments/environment.ts with your credentials
npm start
```

### Get Your Credentials

1. Sign up at [SablePay Dashboard](https://sablepay.io/dashboard)
2. Navigate to **API Keys**
3. Generate a sandbox API key
4. Copy your Merchant ID

---

## Integration Overview

### Step 1: Add SDK Dependency

**Android (Kotlin):**
```kotlin
dependencies {
    implementation("io.sablepay:sdk:1.0.0")
}
```

**Web (npm - React):**
```bash
npm install @sablepay/react-sablepay-js
```

**Web (npm - Angular):**
```bash
npm install @sablepay/angular-sablepay-js
```

**Flutter (pub.dev):** *(Coming Soon)*
```yaml
dependencies:
  sablepay_flutter: ^1.0.0
```

### Step 2: Initialize SDK

**Android:**
```kotlin
SablePay.initialize(
    context = applicationContext,
    apiKey = "sable_sk_sand_...",
    merchantId = "your-merchant-uuid"
)
```

**Web (React / Next.js):**
```tsx
import { SablePay } from '@sablepay/react-sablepay-js';

SablePay.initialize({
  apiKey: 'sable_sk_sand_...',
  merchantId: 'your-merchant-uuid',
  baseUrl: 'https://sandbox-api.sablepay.io',
});
```

**Web (Angular):**
```typescript
import { SablePay } from '@sablepay/angular-sablepay-js';

SablePay.initialize({
  apiKey: 'sable_sk_sand_...',
  merchantId: 'your-merchant-uuid',
  baseUrl: 'https://sandbox-api.sablepay.io/api/v1/',
});
```

### Step 3: Create Payment

**Android:**
```kotlin
val request = CreatePaymentRequest(
    amount = 1050,        // $10.50 in cents
    currency = "USDC",
    description = "Order #123"
)

SablePay.getInstance().createPayment(request)
    .onSuccess { response ->
        // Display QR code
        val qr = SablePay.getInstance().generateQrCode(response.linkToken!!)
        imageView.setImageBitmap(qr)
    }
```

**Web:**
```tsx
import { SablePay, CreatePaymentRequest, QrCodeGenerator } from '@sablepay/react-sablepay-js';

const request: CreatePaymentRequest = {
  amount: 5,
  items: [{ name: 'Espresso', quantity: 1, amount: 5 }],
  metadata: { source: 'my-app' },
};

const response = await SablePay.getInstance().createPayment(request);

// Generate a QR code
const qrGen = new QrCodeGenerator();
const dataUrl = await qrGen.generatePaymentQr(response, { width: 280 });
```

### Step 4: Handle Payment Status

**Android:**
```kotlin
SablePay.createPaymentPoller()
    .pollStatus(paymentId, intervalMs = 3000)
    .collect { result ->
        result.onSuccess { status ->
            when (status.status) {
                "completed" -> showSuccess()
                "failed" -> showError(status.failureReason)
            }
        }
    }
```

**Web:**
```tsx
const status = await SablePay.getInstance().getPaymentStatus(paymentId);

if (status.status === 'completed') {
  showSuccess();
} else if (status.status === 'failed' || status.status === 'expired') {
  showError();
}
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/API.md) | Complete API documentation |
| [Security Guide](docs/SECURITY.md) | Security best practices |
| [Integration Guide](docs/VENDOR_INTEGRATION_GUIDE.md) | Step-by-step integration |

---

## Repository Structure

```
sablepay-examples/
├── android/                 # Android SDK example
│   ├── app/                 # Example app source
│   ├── gradle/              # Gradle wrapper
│   └── README.md            # Android-specific guide
├── web/
│   ├── react/               # React (Next.js) SDK example
│   └── angular/             # Angular SDK example
├── flutter/                 # Flutter SDK example (coming soon)
├── docs/                    # Shared documentation
│   ├── API.md
│   ├── SECURITY.md
│   └── VENDOR_INTEGRATION_GUIDE.md
└── README.md                # This file
```

---

## Support

- **Email:** sdk-support@sablepay.io
- **Documentation:** https://docs.sablepay.io
- **Issues:** [GitHub Issues](https://github.com/AshishPal04/sablepay-examples/issues)

---

## License

Copyright © 2026 SablePay. See [LICENSE](LICENSE) for details.
