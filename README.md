# SablePay SDK Examples

[![Build](https://github.com/AshishPal04/sablepay-examples/actions/workflows/build.yml/badge.svg)](https://github.com/AshishPal04/sablepay-examples/actions/workflows/build.yml)

Integration examples for SablePay SDKs across multiple platforms.

## Available Examples

| Platform | Status | Directory | Documentation |
|----------|--------|-----------|---------------|
| **Android** | âœ… Available | [/android](./android) | [Android Guide](./android/README.md) |
| **Web** | ðŸ”œ Coming Soon | [/web](./web) | - |
| **Flutter** | ðŸ”œ Coming Soon | [/flutter](./flutter) | - |

---

## Quick Start

### Android

`ash
cd android
cp local.properties.example local.properties
# Edit local.properties with your credentials
./gradlew installDebug
`

### Get Your Credentials

1. Sign up at [SablePay Dashboard](https://dashboard.sablepay.com)
2. Navigate to **API Keys**
3. Generate a sandbox API key
4. Copy your Merchant ID

---

## Integration Overview

### Step 1: Add SDK Dependency

**Android (Kotlin):**
`kotlin
dependencies {
    implementation("io.sablepay:sdk:1.0.0")
}
`

**Web (npm):** *(Coming Soon)*
`ash
npm install @sablepay/sdk
`

**Flutter (pub.dev):** *(Coming Soon)*
`yaml
dependencies:
  sablepay_flutter: ^1.0.0
`

### Step 2: Initialize SDK

**Android:**
`kotlin
SablePay.initialize(
    context = applicationContext,
    apiKey = "sable_sk_sand_...",
    merchantId = "your-merchant-uuid"
)
`

### Step 3: Create Payment

**Android:**
`kotlin
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
`

### Step 4: Handle Payment Status

**Android:**
`kotlin
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
`

---

## Documentation

| Document | Description |
|----------|-------------|
| [API Reference](docs/API.md) | Complete API documentation |
| [Security Guide](docs/SECURITY.md) | Security best practices |
| [Integration Guide](docs/VENDOR_INTEGRATION_GUIDE.md) | Step-by-step integration |

---

## Repository Structure

`
sablepay-examples/
â”œâ”€â”€ android/                 # Android SDK example
â”‚   â”œâ”€â”€ app/                 # Example app source
â”‚   â”œâ”€â”€ gradle/              # Gradle wrapper
â”‚   â””â”€â”€ README.md            # Android-specific guide
â”œâ”€â”€ web/                     # Web SDK example (coming soon)
â”œâ”€â”€ flutter/                 # Flutter SDK example (coming soon)
â”œâ”€â”€ docs/                    # Shared documentation
â”‚   â”œâ”€â”€ API.md
â”‚   â”œâ”€â”€ SECURITY.md
â”‚   â””â”€â”€ VENDOR_INTEGRATION_GUIDE.md
â””â”€â”€ README.md                # This file
`

---

## Support

- **Email:** sdk-support@sablepay.com
- **Documentation:** https://docs.sablepay.com
- **Issues:** [GitHub Issues](https://github.com/AshishPal04/sablepay-examples/issues)

---

## License

Copyright Â© 2026 SablePay. See [LICENSE](LICENSE) for details.
