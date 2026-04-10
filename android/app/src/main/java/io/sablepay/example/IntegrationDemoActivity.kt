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
 * SablePay Integration Example.
 *
 * Demonstrates the simplest way to accept payments:
 * 1. Enter an amount
 * 2. Call SablePay.launchPayment() — SDK handles QR, polling, and result screens
 * 3. Handle the result in onActivityResult()
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
            buttonPay.setOnClickListener {
                val amountText = editTextAmount.text.toString()
                val amount = amountText.toDoubleOrNull()

                if (amount == null || amount <= 0) {
                    Toast.makeText(this@IntegrationDemoActivity, "Enter a valid amount", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }

                // Launch the SDK payment screen — one line!
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

        SablePay.handlePaymentResult(requestCode, resultCode, data) { result ->
            result.onSuccess { payment: PaymentResult ->
                Toast.makeText(
                    this,
                    "Payment Complete!\n" +
                        "ID: ${payment.paymentId.take(8)}...\n" +
                        "Amount: ${payment.formattedAmount}",
                    Toast.LENGTH_LONG
                ).show()

                // Clear the amount field for next payment
                binding.editTextAmount.text?.clear()
            }
            result.onFailure { error ->
                Toast.makeText(
                    this,
                    "Payment Failed: ${error.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }
}
