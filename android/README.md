# SablePay Android SDK Example

This example demonstrates integrating the SablePay Android SDK for accepting stablecoin payments.

## Requirements

- Android Studio Hedgehog (2023.1.1)+
- Android 10+ (API 29+) device/emulator
- Kotlin 1.9+
- SablePay merchant account

## Quick Start

### 1. Add Dependency

In your `app/build.gradle.kts`:

```kotlin
dependencies {
    implementation("io.sablepay:sdk:1.0.2")
}
```

### 2. Configure Credentials

```bash
cp local.properties.example local.properties
```

Edit `local.properties` with your credentials from the [SablePay Dashboard](https://dashboard.sablepay.com):

```properties
sablepay.apiKey=sable_sk_sand_YOUR_API_KEY
sablepay.merchantId=YOUR_MERCHANT_UUID
sablepay.baseUrl=https://sandbox-api.sablepay.io/api/v1/
```

### 3. Build & Run

```bash
./gradlew installDebug
```

Or open in Android Studio and click **Run**.

## How It Works

The SDK handles the entire payment flow — just call two methods:

**Step 1: Initialize (once in Application class)**

```kotlin
SablePay.initialize(
    context = this,
    apiKey = "sable_sk_sand_YOUR_API_KEY",
    merchantId = "your-merchant-uuid",
    baseUrl = "https://sandbox-api.sablepay.io/api/v1/"
)
```

**Step 2: Launch Payment**

```kotlin
SablePay.launchPayment(this, 10.50)  // amount in USD
```

**Step 3: Handle Result**

```kotlin
override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    SablePay.handlePaymentResult(requestCode, resultCode, data) { result ->
        result.onSuccess { payment ->
            println("Payment ID: ${payment.paymentId}")
            println("Amount: ${payment.formattedAmount}")
            println("Paid: ${payment.formattedPaidAmount}")
        }
        result.onFailure { error ->
            println("Error: ${error.message}")
        }
    }
}
```

The SDK displays a full payment screen with QR code, countdown timer, and auto-polling. When the customer pays, it closes automatically and returns the result.

## Environments

| Environment    | Base URL                                      | API Key Prefix     |
|----------------|-----------------------------------------------|--------------------|
| **Production** | `https://api.sablepay.com/api/v1/`            | `sable_sk_live_`   |
| **Sandbox**    | `https://sandbox-api.sablepay.io/api/v1/`     | `sable_sk_sand_`   |

## Support

- Email: sdk-support@sablepay.com
- GitHub Issues: [sablepay-examples/issues](https://github.com/Sable-Payments-Inc/sablepay-examples/issues)
