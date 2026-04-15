# SablePay Android SDK Example

This example demonstrates integrating the SablePay Android SDK for accepting stablecoin payments.

## Requirements

- Android Studio Hedgehog (2023.1.1)+
- Android 10+ (API 29+) device/emulator
- Kotlin 1.9+
- SablePay merchant account

## Add Dependency

Add to your `app/build.gradle.kts`:

```kotlin
dependencies {
    implementation("io.sablepay:sdk:1.0.5")
}
```

## Initialize SDK

```kotlin
import io.sablepay.sdk.SablePay

class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        SablePay.initialize(
            context = this,
            apiKey = "sable_sk_live_YOUR_API_KEY_HERE",
            merchantId = "your-merchant-uuid-here",
            baseUrl = "https://sandbox-api.sablepay.io/api/v1/",
            enableLogging = BuildConfig.DEBUG
        )
    }
}
```

## Collect Payment

Launch a full payment screen with QR code, countdown timer, and auto-polling — all in one line:

```kotlin
import io.sablepay.sdk.SablePay
import io.sablepay.sdk.launchPayment

// Launch payment screen (one line!)
SablePay.launchPayment(this, 10.50)  // amount
```

## Handle Payment Result

The SDK handles QR display, status polling, and success/failure screens automatically. Handle the result in your Activity:

```kotlin
import io.sablepay.sdk.handlePaymentResult

override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    SablePay.handlePaymentResult(requestCode, resultCode, data) { result ->
        result.onSuccess { payment ->
            // Payment successful!
            println("Payment ID: ${payment.paymentId}")
            println("TX Hash: ${payment.transactionHash}")
            println("Paid: ${payment.formattedPaidAmount}")
        }
        result.onFailure { error ->
            // Payment failed or cancelled
            println("Error: ${error.message}")
        }
    }
}
```

## Cleanup

When the merchant logs out or switches accounts:

```kotlin
SablePay.release()  // Clears stored credentials
```

## Environments

| Environment    | Base URL                                      | API Key Prefix     |
|----------------|-----------------------------------------------|--------------------|
| **Production** | `https://api.sablepay.com/api/v1/`            | `sable_sk_live_`   |
| **Sandbox**    | `https://sandbox-api.sablepay.io/api/v1/`     | `sable_sk_sand_`   |

## Support

- Email: sdk-support@sablepay.com
- GitHub Issues: [sablepay-examples/issues](https://github.com/Sable-Payments-Inc/sablepay-examples/issues)
