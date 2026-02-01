package io.sablepay.example

import android.app.Application
import io.sablepay.sdk.SablePay

/**
 * Example application demonstrating SablePay SDK initialization.
 */
class SablePayExampleApp : Application() {

    override fun onCreate() {
        super.onCreate()

        // Initialize SablePay SDK
        // In a real app, these would come from secure configuration
        initializeSablePay()
    }

    private fun initializeSablePay() {
        try {
            val apiKey = BuildConfig.SABLEPAY_API_KEY
            val merchantId = BuildConfig.SABLEPAY_MERCHANT_ID
            val baseUrl = BuildConfig.SABLEPAY_BASE_URL
        
            if (apiKey.isBlank() || merchantId.isBlank() || baseUrl.isBlank()) {
                throw IllegalStateException(
                    "SablePay credentials not configured. " +
                    "Please add sablepay.sandbox.apiKey, sablepay.sandbox.merchantId, and sablepay.sandbox.baseUrl to local.properties"
                )
            }

            SablePay.initialize(
                context = this,
                // TODO: Replace with your actual SablePay sandbox credentials
                // Get these from: https://dashboard.sablepay.com/developers/api-keys
                apiKey = apiKey, // Format: sable_sk_sand_xxxxx...
                merchantId = merchantId, // Format: UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
                baseUrl = baseUrl,
                enableLogging = BuildConfig.DEBUG
            )
            
            // Pre-warm SDK components for faster first payment
            // This runs asynchronously and reduces first QR code display from ~7s to ~2s
            SablePay.preloadAsync()
        } catch (e: Exception) {
            // Handle initialization error
            // In production, you might want to show an error UI or retry
            e.printStackTrace()
        }
    }

    override fun onTerminate() {
        super.onTerminate()
        // Release SDK resources
        if (SablePay.isInitialized()) {
            SablePay.release()
        }
    }
}
