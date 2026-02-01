# SablePay Android SDK - Vendor Integration Guide

Complete guide for integrating SablePay into your Android POS system.

---

## Table of Contents

1. [Distribution Options](#distribution-options)
2. [Quick Start Integration](#quick-start-integration)
3. [POS-Specific Implementation](#pos-specific-implementation)
4. [Production Checklist](#production-checklist)
5. [Testing & Certification](#testing--certification)
6. [Support & Resources](#support--resources)

---

## Distribution Options

### Option 1: Maven Central (Recommended)

**Best for**: Production POS systems requiring stable, versioned releases.

Add to your app's `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.sablepay:sdk:1.0.0")
}
```

**Advantages**:
- ✅ Automatic dependency resolution
- ✅ Versioned releases with changelogs
- ✅ Works offline with Gradle cache
- ✅ Industry standard for Android libraries

---

### Option 2: JitPack (GitHub-based)

**Best for**: Early access to features, beta testing.

**Step 1**: Add JitPack repository to your root `settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}
```

**Step 2**: Add dependency:

```kotlin
dependencies {
    implementation("com.github.sablepay:sablepay-android-sdk:1.0.0")
}
```

---

### Option 3: Direct AAR File

**Best for**: Offline POS systems, custom deployment.

**Step 1**: Download the AAR file from the releases page or build locally:

```bash
./gradlew sdk:assembleRelease
# Output: sdk/build/outputs/aar/sdk-release.aar
```

**Step 2**: Copy `sdk-release.aar` to your app's `libs/` folder.

**Step 3**: Add to your app's `build.gradle.kts`:

```kotlin
dependencies {
    implementation(files("libs/sdk-release.aar"))
    
    // Add required transitive dependencies manually
    implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.21")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("com.jakewharton.timber:timber:5.0.1")
}
```

---

## Quick Start Integration

### Prerequisites

- **Android 10+ (API 29+)** - Required for TLS 1.2+ and hardware-backed keystore
- **Kotlin 1.9+**
- **Gradle 8.0+**
- **SablePay API credentials** (API key + Merchant ID)

### Step 1: Add Dependencies

See [Distribution Options](#distribution-options) above.

### Step 2: Initialize SDK

Initialize **once** in your `Application` class:

```kotlin
class POSApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // Initialize SablePay SDK
        SablePay.initialize(
            context = this,
            apiKey = BuildConfig.SABLEPAY_API_KEY,        // From BuildConfig
            merchantId = BuildConfig.SABLEPAY_MERCHANT_ID, // From BuildConfig
            baseUrl = "https://api.sablepay.io/api/v1/",  // Production URL
            enableLogging = BuildConfig.DEBUG              // Debug logging only
        )
    }
}
```

**Security Best Practice**: Store credentials in `local.properties` (gitignored):

```properties
# local.properties (DO NOT commit to Git)
sablepay.api.key=sable_sk_live_YOUR_LIVE_KEY_HERE
sablepay.merchant.id=YOUR_MERCHANT_ID_UUID_HERE
```

Load in `app/build.gradle.kts`:

```kotlin
// Load local.properties
val localProperties = Properties()
val localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) {
    localPropertiesFile.inputStream().use { localProperties.load(it) }
}

android {
    defaultConfig {
        // Inject as BuildConfig fields
        buildConfigField(
            "String",
            "SABLEPAY_API_KEY",
            "\"${localProperties.getProperty("sablepay.api.key")}\""
        )
        buildConfigField(
            "String",
            "SABLEPAY_MERCHANT_ID",
            "\"${localProperties.getProperty("sablepay.merchant.id")}\""
        )
    }
    
    buildFeatures {
        buildConfig = true
    }
}
```

### Step 3: Create Your First Payment

```kotlin
class CheckoutActivity : AppCompatActivity() {
    private val sablePay by lazy { SablePay.getInstance() }
    
    private fun processPayment(amount: Long, description: String) {
        lifecycleScope.launch {
            showLoadingIndicator()
            
            val request = CreatePaymentRequest(
                amount = amount,              // Amount in cents (e.g., 1000 = $10.00)
                currency = "USDC",            // USDC, USDT, DAI, PYUSD, TUSD
                description = description,
                metadata = mapOf(
                    "terminal_id" to getTerminalId(),
                    "cashier_id" to getCashierId(),
                    "transaction_id" to generateTransactionId()
                )
            )
            
            sablePay.createPayment(request)
                .onSuccess { response ->
                    hideLoadingIndicator()
                    
                    // Display QR code for customer to scan
                    displayPaymentQR(response.linkToken)
                    
                    // Start polling for payment status
                    startStatusPolling(response.paymentId)
                }
                .onFailure { error ->
                    hideLoadingIndicator()
                    handlePaymentError(error)
                }
        }
    }
    
    private fun handlePaymentError(error: Throwable) {
        when (error) {
            is ApiException -> {
                when (error.statusCode) {
                    401 -> showError("Authentication failed. Check credentials.")
                    429 -> showError("Too many requests. Please wait.")
                    else -> showError("Payment failed: ${error.message}")
                }
            }
            is java.net.UnknownHostException -> {
                showError("Network error. Check connection.")
            }
            else -> {
                showError("Unexpected error: ${error.message}")
            }
        }
    }
}
```

### Step 4: Poll Payment Status

```kotlin
private fun startStatusPolling(paymentId: String) {
    lifecycleScope.launch {
        var attempts = 0
        val maxAttempts = 60 // Poll for up to 5 minutes (5s interval)
        
        while (attempts < maxAttempts) {
            delay(5000) // Poll every 5 seconds
            
            sablePay.getPaymentStatus(paymentId)
                .onSuccess { status ->
                    when (status.status) {
                        "completed" -> {
                            // Payment successful!
                            showSuccessScreen(status.txHash)
                            printReceipt(status)
                            return@launch
                        }
                        "failed" -> {
                            // Payment failed
                            showErrorScreen(status.failureReason)
                            return@launch
                        }
                        "pending" -> {
                            // Still pending, continue polling
                            updateStatusUI("Waiting for payment...")
                        }
                    }
                }
                .onFailure { error ->
                    // Log error but continue polling
                    Timber.w(error, "Status check failed")
                }
            
            attempts++
        }
        
        // Timeout after max attempts
        showErrorScreen("Payment timed out")
    }
}
```

---

## POS-Specific Implementation

### Handling Network Interruptions

POS systems often experience network instability. Implement retry logic:

```kotlin
suspend fun <T> retryWithBackoff(
    maxRetries: Int = 3,
    initialDelayMs: Long = 1000,
    block: suspend () -> T
): T {
    var currentDelay = initialDelayMs
    repeat(maxRetries - 1) { attempt ->
        try {
            return block()
        } catch (e: IOException) {
            Timber.w("Retry attempt ${attempt + 1}/$maxRetries")
            delay(currentDelay)
            currentDelay *= 2 // Exponential backoff
        }
    }
    return block() // Last attempt throws exception
}

// Usage:
val result = retryWithBackoff {
    sablePay.createPayment(request)
}
```

### Offline Mode Handling

```kotlin
private fun isNetworkAvailable(): Boolean {
    val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = connectivityManager.activeNetwork ?: return false
    val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}

private fun processPayment(request: CreatePaymentRequest) {
    if (!isNetworkAvailable()) {
        // Queue payment for later processing
        queueOfflinePayment(request)
        showOfflineMessage()
        return
    }
    
    // Process online
    lifecycleScope.launch {
        sablePay.createPayment(request)
            .onSuccess { /* ... */ }
    }
}
```

### Receipt Printing Integration

```kotlin
private fun printReceipt(status: PaymentStatusResponse) {
    val receiptData = buildString {
        appendLine("=============================")
        appendLine("      SablePay Receipt       ")
        appendLine("=============================")
        appendLine()
        appendLine("Payment ID: ${status.paymentId.take(8)}...")
        appendLine("Amount: ${formatAmount(status.amount, status.currency)}")
        appendLine("Currency: ${status.currency}")
        appendLine("Status: ${status.status.uppercase()}")
        appendLine("Tx Hash: ${status.txHash?.take(10)}...")
        appendLine("Date: ${formatDate(status.completedAt)}")
        appendLine()
        appendLine("=============================")
        appendLine("   Thank you for your payment!")
        appendLine("=============================")
    }
    
    // Send to printer (adjust based on your printer SDK)
    printerService.print(receiptData)
}

private fun formatAmount(amountInCents: Long, currency: String): String {
    val dollars = amountInCents / 100.0
    return "$${String.format("%.2f", dollars)} $currency"
}
```

### Error Recovery Strategies

```kotlin
sealed class PaymentState {
    object Idle : PaymentState()
    object Processing : PaymentState()
    data class QRDisplayed(val linkToken: String, val paymentId: String) : PaymentState()
    data class PollingStatus(val paymentId: String, val attempts: Int) : PaymentState()
    data class Success(val txHash: String) : PaymentState()
    data class Failed(val reason: String, val canRetry: Boolean) : PaymentState()
}

class PaymentViewModel : ViewModel() {
    private val _state = MutableStateFlow<PaymentState>(PaymentState.Idle)
    val state: StateFlow<PaymentState> = _state
    
    private var lastRequest: CreatePaymentRequest? = null
    
    fun createPayment(request: CreatePaymentRequest) {
        lastRequest = request // Save for retry
        _state.value = PaymentState.Processing
        
        viewModelScope.launch {
            sablePay.createPayment(request)
                .onSuccess { response ->
                    _state.value = PaymentState.QRDisplayed(
                        response.linkToken ?: "",
                        response.paymentId
                    )
                    pollStatus(response.paymentId)
                }
                .onFailure { error ->
                    val canRetry = error is IOException || 
                                   (error is ApiException && error.statusCode >= 500)
                    _state.value = PaymentState.Failed(
                        error.message ?: "Unknown error",
                        canRetry
                    )
                }
        }
    }
    
    fun retryPayment() {
        lastRequest?.let { createPayment(it) }
    }
    
    private suspend fun pollStatus(paymentId: String) {
        // ... polling implementation
    }
}
```

---

## Production Checklist

### Security

- [ ] API keys stored in encrypted storage (never hardcoded)
- [ ] Use production API URL (`https://api.sablepay.io/api/v1/`)
- [ ] Disable verbose logging in release builds
- [ ] Enable ProGuard/R8 code obfuscation
- [ ] Test TLS 1.2+ connectivity on all POS devices
- [ ] Implement certificate pinning (optional, see `docs/SECURITY.md`)
- [ ] Clear credentials on app uninstall/logout

### Performance

- [ ] Test payment creation under 3 seconds
- [ ] Implement background status polling (don't block UI)
- [ ] Handle low memory scenarios
- [ ] Test on minimum spec POS hardware (Android 10)
- [ ] Optimize QR code display for various screen sizes

### Error Handling

- [ ] Network timeout recovery (retry with exponential backoff)
- [ ] Display user-friendly error messages
- [ ] Log errors to crashlytics/monitoring service
- [ ] Handle API rate limits (429 responses)
- [ ] Graceful degradation for offline mode

### User Experience

- [ ] Display payment QR code within 2 seconds
- [ ] Show real-time status updates during polling
- [ ] Provide clear success/failure feedback
- [ ] Support payment cancellation
- [ ] Print receipts automatically on success

### Testing

1. **Test with sandbox API** (`https://sandbox.api.sablepay.io/api/v1/`)
- [ ] Verify all supported currencies (USDC, USDT, DAI, PYUSD, TUSD)
- [ ] Test payment timeout scenarios
- [ ] Simulate network interruptions
- [ ] Load test with 100+ transactions/day
- [ ] Test on multiple Android 10+ devices

---

## Testing & Certification

### Sandbox Testing

Use sandbox credentials for testing:

```kotlin
SablePay.initialize(
    context = this,
    apiKey = "sable_sk_sand_YOUR_SANDBOX_KEY",
    merchantId = "sandbox-merchant-id",
    baseUrl = "https://sandbox.api.sablepay.io/api/v1/",
    enableLogging = true
)
```

**Sandbox Test Cases**:

1. **Successful Payment**: Create payment → Display QR → Simulate scan → Verify completion
2. **Failed Payment**: Test insufficient funds scenario
3. **Timeout**: Test payment expiration (default 15 minutes)
4. **Network Failure**: Disable WiFi mid-transaction → Verify retry
5. **Rate Limiting**: Send 150 requests in 1 minute → Verify 429 handling

### Pre-Production Certification

Contact SablePay support (ashish@sablepay.io) for:

1. **API Key Rotation**: Replace sandbox keys with production keys
2. **Webhook Setup**: Configure webhook URLs for payment notifications
3. **Rate Limit Adjustment**: Request higher limits for high-volume POS
4. **Security Audit**: Review security implementation
5. **Go-Live Approval**: Final certification before production deployment

---

## Support & Resources

### Documentation

- **API Reference**: [docs/API.md](API.md)
- **Architecture Guide**: [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- **Security Guide**: [docs/SECURITY.md](SECURITY.md)
- **Webhook Handling**: [docs/WEBHOOK_HANDLING.md](WEBHOOK_HANDLING.md)
- **Migration Guide**: [docs/MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

### Code Examples

- **Example App**: See [example-app/](../example-app/) for complete implementation
- **GitHub**: https://github.com/sablepay/sablepay-android-sdk

### Support Channels

- **Email**: ashish@sablepay.io
- **Issues**: https://github.com/sablepay/sablepay-android-sdk/issues
- **Slack**: Join our vendor integration channel (request invite)
- **Documentation**: https://docs.sablepay.io

### SLA & Uptime

- **API Availability**: 99.9% uptime SLA
- **Status Page**: https://status.sablepay.io
- **Incident Response**: <4 hour response time for critical issues
- **Maintenance Windows**: Announced 48 hours in advance

---

## Frequently Asked Questions

### Q: What Android versions are supported?

**A**: Android 10+ (API level 29+). This ensures TLS 1.2+ support and hardware-backed keystore security.

### Q: Can I use this SDK offline?

**A**: No, payment creation requires internet connectivity. Implement offline queuing if needed (see [Offline Mode Handling](#offline-mode-handling)).

### Q: How long does a payment QR code remain valid?

**A**: Default 15 minutes. Configurable via API (contact support).

### Q: What happens if payment status polling times out?

**A**: The payment remains in "pending" state on the server. Check status later using `getPaymentStatus()`.

### Q: How do I handle refunds?

**A**: Contact SablePay support or use the merchant dashboard. SDK does not currently support refunds.

### Q: Can I customize the payment QR code UI?

**A**: Yes, the `linkToken` is a Base64-encoded URL. Decode and generate QR codes using any library (e.g., ZXing).

### Q: What are the transaction fees?

**A**: Contact SablePay sales for pricing details.

### Q: How do I test webhooks locally?

**A**: Use ngrok or similar tunneling service to expose local server. See [docs/WEBHOOK_HANDLING.md](WEBHOOK_HANDLING.md).

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-15 | Initial release |

---

**Need Help?** Contact our integration team at ashish@sablepay.io
