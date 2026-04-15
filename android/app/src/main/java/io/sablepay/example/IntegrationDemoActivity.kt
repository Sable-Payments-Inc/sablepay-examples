package io.sablepay.example

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import io.sablepay.example.databinding.ActivitySimplePaymentBinding
import io.sablepay.sdk.SablePay
import io.sablepay.sdk.handlePaymentResult
import io.sablepay.sdk.launchPayment

class IntegrationDemoActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySimplePaymentBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySimplePaymentBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.buttonPay.setOnClickListener {
            val amount = binding.editTextAmount.text.toString().toDoubleOrNull()

            if (amount == null || amount <= 0) {
                Toast.makeText(this, "Enter a valid amount", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Launch payment screen (one line!)
            SablePay.launchPayment(this, amount)
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        SablePay.handlePaymentResult(requestCode, resultCode, data) { result ->
            result.onSuccess { payment ->
                Toast.makeText(
                    this,
                    "Payment successful!\n" +
                        "ID: ${payment.paymentId}\n" +
                        "TX Hash: ${payment.transactionHash}\n" +
                        "Paid: ${payment.formattedPaidAmount}",
                    Toast.LENGTH_LONG
                ).show()
                binding.editTextAmount.text?.clear()
            }
            result.onFailure { error ->
                Toast.makeText(this, "Payment failed: ${error.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
