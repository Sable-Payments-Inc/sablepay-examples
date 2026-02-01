# SablePay Android SDK - API Reference

## Overview

This document provides a complete API reference for the SablePay Android SDK.

## Core Classes

### SablePay

The main entry point for the SDK.

#### Static Methods

```kotlin
// Initialize SDK (call once, typically in Application.onCreate())
fun initialize(
    context: Context,
    apiKey: String,
    merchantId: String,
    baseUrl: String = NetworkConfig.BASE_URL_PRODUCTION,
    enableLogging: Boolean = false
)

// Get SDK instance
fun getInstance(): SablePay

// Check if SDK is initialized
fun isInitialized(): Boolean

// Release SDK resources
fun release()
```

#### Instance Methods

```kotlin
// Create a new payment
suspend fun createPayment(
    request: CreatePaymentRequest,
    enableRetry: Boolean = true
): Result<CreatePaymentResponse>

// Get payment status
suspend fun getPaymentStatus(
    paymentId: String,
    enableRetry: Boolean = true
): Result<PaymentStatusResponse>

// Check if credentials are configured
fun isConfigured(): Boolean

// Get current environment
fun getEnvironment(): String?  // "sandbox", "production", or null
```

---

## Models

### CreatePaymentRequest

```kotlin
data class CreatePaymentRequest(
    val amount: Long,                           // Required: Amount in smallest unit
    val currency: String,                       // Required: USDC, USDT, DAI, PYUSD, TUSD
    val description: String,                    // Required: Payment description
    val returnUrl: String? = null,              // Optional: Redirect URL
    val metadata: Map<String, String>? = null,  // Optional: Custom data
    val orderId: String? = null,                // Optional: Your order ID
    val expiresInMinutes: Int? = null           // Optional: Expiration (default: 30)
)
```

### CreatePaymentResponse

```kotlin
data class CreatePaymentResponse(
    val success: Boolean,
    val paymentId: String,
    val linkToken: String?,          // Base64-encoded QR data
    val amount: Long,
    val currency: String,
    val status: String,
    val expiresAt: String?,
    val createdAt: String,
    val requestId: String
) {
    val isPending: Boolean
    val isCompleted: Boolean
    val isFailed: Boolean
    val isExpired: Boolean
}
```

### PaymentStatusResponse

```kotlin
data class PaymentStatusResponse(
    val success: Boolean,
    val paymentId: String,
    val status: String,
    val amount: Long,
    val currency: String,
    val linkToken: String?,
    val txHash: String?,             // Blockchain TX (when completed)
    val completedAt: String?,
    val failureReason: String?,
    val requestId: String
) {
    val isPending: Boolean
    val isCompleted: Boolean
    val isFailed: Boolean
    val isExpired: Boolean
    val isTerminal: Boolean          // completed, failed, or expired
}
```

### PaymentStatus

```kotlin
object PaymentStatus {
    const val PENDING = "pending"
    const val COMPLETED = "completed"
    const val FAILED = "failed"
    const val EXPIRED = "expired"
    const val CANCELLED = "cancelled"
}
```

---

## Error Handling

### ApiException

```kotlin
class ApiException(
    override val message: String,
    val statusCode: Int,
    val requestId: String? = null,
    val details: String? = null,
    val retryAfter: Long? = null     // Seconds (for 429)
) : Exception {
    val isClientError: Boolean       // 4xx
    val isServerError: Boolean       // 5xx
    val isRateLimitError: Boolean    // 429
    val isAuthError: Boolean         // 401
    val isNotFoundError: Boolean     // 404
    val isRetryable: Boolean         // 5xx or 429
}
```

---

## Utilities

### PaymentPoller

```kotlin
class PaymentPoller {
    // Poll as Flow
    fun pollStatus(
        paymentId: String,
        intervalMs: Long = 3000,
        maxAttempts: Int = 60,
        stopOnTerminal: Boolean = true
    ): Flow<Result<PaymentStatusResponse>>
    
    // Poll until terminal state
    suspend fun pollUntilTerminal(
        paymentId: String,
        intervalMs: Long = 3000,
        maxAttempts: Int = 60
    ): Result<PaymentStatusResponse>
}
```

---

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Fix request parameters |
| 401 | Unauthorized | Check API key / merchant ID |
| 404 | Not Found | Payment doesn't exist |
| 429 | Rate Limited | Retry after `retryAfter` seconds |
| 500 | Server Error | Retry with backoff |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /payments/create | 100/min per merchant |
| GET /payments/{id} | 300/min per merchant |
| GET /payments | 60/min per merchant |
