package io.sablepay.example

import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import io.sablepay.sdk.PaymentFlow
import io.sablepay.sdk.PaymentFlowError
import io.sablepay.sdk.PaymentFlowListener
import io.sablepay.sdk.SablePay
import io.sablepay.sdk.models.CreatePaymentResponse
import io.sablepay.sdk.models.PaymentStatusResponse

/**
 * Simplified example showing the easiest way to integrate SablePay.
 *
 * This demonstrates how a merchant can accept crypto payments
 * with just a few lines of code using PaymentFlow.
 */
class SimplePaymentActivity : AppCompatActivity() {

    // SDK payment flow - handles everything!
    private lateinit var paymentFlow: PaymentFlow

    // UI elements
    private lateinit var progressBar: ProgressBar
    private lateinit var imageQrCode: ImageView
    private lateinit var textStatus: TextView
    private lateinit var textAmount: TextView
    private lateinit var buttonPay: MaterialButton
    private lateinit var buttonNewPayment: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_simple_payment)

        // Initialize SDK (typically done in Application class)
        if (!SablePay.isInitialized()) {
            SablePay.initialize(
                context = applicationContext,
                apiKey = "sable_sk_sand_test1234567890123456789012345678901234",
                merchantId = "00000000-0000-0000-0000-000000000000",
                baseUrl = "https://testing.dvbouj5ym82y2.amplifyapp.com/api/v1/"
            )
        }

        // Create payment flow instance
        paymentFlow = SablePay.createPaymentFlow()

        setupUI()
    }

    private fun setupUI() {
        progressBar = findViewById(R.id.progressBar)
        imageQrCode = findViewById(R.id.imageQrCode)
        textStatus = findViewById(R.id.textStatus)
        textAmount = findViewById(R.id.textAmount)
        buttonPay = findViewById(R.id.buttonPay)
        buttonNewPayment = findViewById(R.id.buttonNewPayment)

        buttonPay.setOnClickListener {
            startPayment()
        }

        buttonNewPayment.setOnClickListener {
            resetUI()
        }
    }

    /**
     * Start a payment - this is where the magic happens!
     *
     * Just 1 method call with a listener - SDK handles:
     * ✅ Creating payment via API
     * ✅ Generating QR code
     * ✅ Polling for status updates
     * ✅ Notifying when complete/failed
     */
    private fun startPayment() {
        // Show loading
        buttonPay.isEnabled = false
        progressBar.visibility = View.VISIBLE
        textStatus.text = "Creating payment..."

        // Start payment flow with just required parameters
        paymentFlow.startPayment(
            amount = 5.00,                    // $5.00 USD
            listener = object : PaymentFlowListener {

                override fun onPaymentCreated(response: CreatePaymentResponse, qrCode: Bitmap) {
                    // QR code ready - show it to customer!
                    runOnUiThread {
                        progressBar.visibility = View.GONE
                        imageQrCode.setImageBitmap(qrCode)
                        imageQrCode.visibility = View.VISIBLE
                        textAmount.text = "$${String.format("%.2f", response.amount)}"
                        textAmount.visibility = View.VISIBLE
                        textStatus.text = "Scan QR to pay"
                    }
                }

                override fun onStatusUpdate(status: PaymentStatusResponse) {
                    // Payment status changed
                    runOnUiThread {
                        textStatus.text = "Status: ${status.status}"
                    }
                }

                override fun onPaymentCompleted(status: PaymentStatusResponse) {
                    // SUCCESS! Payment received
                    runOnUiThread {
                        textStatus.text = "✅ Payment Complete!"
                        textStatus.setTextColor(getColor(android.R.color.holo_green_dark))
                        Toast.makeText(
                            this@SimplePaymentActivity,
                            "Payment received! TX: ${status.txHash?.take(10)}...",
                            Toast.LENGTH_LONG
                        ).show()
                        buttonNewPayment.visibility = View.VISIBLE
                    }
                }

                override fun onPaymentFailed(error: PaymentFlowError) {
                    // Handle error
                    runOnUiThread {
                        progressBar.visibility = View.GONE
                        textStatus.text = "❌ ${error.message}"
                        textStatus.setTextColor(getColor(android.R.color.holo_red_dark))
                        buttonPay.isEnabled = true
                        buttonNewPayment.visibility = View.VISIBLE
                    }
                }
            }
        )
    }

    private fun resetUI() {
        paymentFlow.cancel()
        progressBar.visibility = View.GONE
        imageQrCode.visibility = View.GONE
        textAmount.visibility = View.GONE
        textStatus.text = "Ready to accept payment"
        textStatus.setTextColor(getColor(android.R.color.black))
        buttonPay.isEnabled = true
        buttonNewPayment.visibility = View.GONE
    }

    override fun onDestroy() {
        // Clean up payment flow
        paymentFlow.release()
        super.onDestroy()
    }
}
