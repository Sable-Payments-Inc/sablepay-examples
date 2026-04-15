package io.sablepay.example

import android.app.Application
import io.sablepay.sdk.SablePay

class SablePayExampleApp : Application() {

    override fun onCreate() {
        super.onCreate()

        SablePay.initialize(
            context = this,
            apiKey = BuildConfig.SABLEPAY_API_KEY,
            merchantId = BuildConfig.SABLEPAY_MERCHANT_ID,
            baseUrl = BuildConfig.SABLEPAY_BASE_URL,
            enableLogging = BuildConfig.DEBUG
        )
    }
}
