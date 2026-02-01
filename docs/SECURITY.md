# SablePay Android SDK - Security

## Overview

The SablePay Android SDK implements multiple layers of security to protect sensitive payment data and API credentials.

## Security Features

### 1. Minimum Android 10 (API 29)

The SDK requires Android 10+ to leverage:
- Hardware-backed keystore (StrongBox)
- BiometricPrompt for authentication
- Scoped storage
- TLS 1.2+ by default

### 2. Encrypted Credential Storage

API keys and secrets are encrypted using:

```kotlin
// Android Keystore with AES-256-GCM
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()

// EncryptedSharedPreferences
val encryptedPrefs = EncryptedSharedPreferences.create(
    context,
    "sablepay_secure_prefs",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

**Never stored in:**
- Plain SharedPreferences
- Hardcoded in source code
- Log files
- Crash reports

### 3. TLS 1.2+ Enforcement

All network communication enforces TLS 1.2 minimum:

```kotlin
val sslContext = SSLContext.getInstance("TLSv1.2")
val trustManager = createDefaultTrustManager()
sslContext.init(null, arrayOf(trustManager), null)

OkHttpClient.Builder()
    .sslSocketFactory(sslContext.socketFactory, trustManager)
    // ...
```

**Disabled protocols:**
- SSLv3
- TLS 1.0
- TLS 1.1

### 4. Certificate Pinning (Optional)

For enhanced security, enable certificate pinning:

```kotlin
// In CertificatePinnerConfig.kt
val certificatePinner = CertificatePinner.Builder()
    .add("api.sablepay.io", "sha256/AAAAAAA...")
    .add("api.sablepay.io", "sha256/BBBBBBB...") // Backup pin
    .build()
```

### 5. API Key Validation

API keys are validated before use:

```kotlin
// Format: sable_sk_(live|sand)_[43 alphanumeric chars]
private val API_KEY_PATTERN = Regex("^sable_sk_(live|sand)_[A-Za-z0-9_-]{43}$")

fun isValidApiKey(apiKey: String): Boolean = API_KEY_PATTERN.matches(apiKey)
```

## Security Checklist

| Security Measure | Status |
|------------------|--------|
| Android 10+ minimum | ✅ |
| API keys in Keystore | ✅ |
| TLS 1.2+ enforced | ✅ |
| Certificate pinning | ✅ Ready |
| API key validation | ✅ |
| Credential cleanup on logout | ✅ |
| No logging in release | ✅ |
| ProGuard minification | ✅ |

## Best Practices

### DO

- ✅ Initialize SDK in Application.onCreate()
- ✅ Use sandbox keys for testing
- ✅ Clear credentials on logout with `SablePay.release()`
- ✅ Enable logging only in debug builds
- ✅ Verify webhook signatures
- ✅ Handle rate limits gracefully

### DON'T

- ❌ Hardcode API keys in source code
- ❌ Log API keys or sensitive data
- ❌ Use plain SharedPreferences for secrets
- ❌ Skip webhook signature verification
- ❌ Disable TLS verification
- ❌ Run on Android < 10

## ProGuard Rules

The SDK includes rules to protect sensitive code:

```proguard
# Remove debug logs in release
-assumenosideeffects class timber.log.Timber* {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep models for JSON serialization
-keep class com.sablepay.sdk.models.** { *; }
```

## Reporting Security Issues

If you discover a security vulnerability, please email:
**security@sablepay.io**

Do not open public issues for security vulnerabilities.
