package io.sablepay.example

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import io.sablepay.example.databinding.ActivitySimplePaymentBinding
import io.sablepay.sdk.PaymentResult
import io.sablepay.sdk.SablePay
import io.sablepay.sdk.handlePaymentResult
import io.sablepay.sdk.launchPayment

/**
 * Simple SablePay Integration Demo.
 *
 * This demonstrates the simplest way to integrate SablePay:
 * 1. Call SablePay.launchPayment() with amount and merchant name
 * 2. Handle the result in onActivityResult()
 *
 * That's it! Just 2 steps.
 */
class IntegrationDemoActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySimplePaymentBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySimplePaymentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
    }

    private fun setupUI() {
        binding.apply {
            // Set default amount
            editTextAmount.setText("10.00")

            // Pay button - simple one-liner!
            buttonPay.setOnClickListener {
                val amountText = editTextAmount.text.toString()
                val amount = amountText.toDoubleOrNull()

                if (amount == null || amount <= 0) {
                    Toast.makeText(this@IntegrationDemoActivity, "Enter a valid amount", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }

                // === THE SIMPLE INTEGRATION ===
                // Just one line to launch a payment!
                SablePay.launchPayment(
                    activity = this@IntegrationDemoActivity,
                    amount = amount
                )
            }
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        // === HANDLE THE RESULT ===
        SablePay.handlePaymentResult(requestCode, resultCode, data) { result ->
            result.onSuccess { payment: PaymentResult ->
                // Payment successful!
                Toast.makeText(
                    this,
                    "Payment Complete!\n" +
                        "ID: ${payment.paymentId.take(8)}...\n" +
                        "Amount: ${payment.formattedAmount}",
                    Toast.LENGTH_LONG
                ).show()
            }
            result.onFailure { error ->
                // Payment failed or cancelled
                Toast.makeText(
                    this,
                    "Payment Failed: ${error.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
}
