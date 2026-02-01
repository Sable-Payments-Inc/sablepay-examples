package io.sablepay.example

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import io.sablepay.example.databinding.ActivityPaymentStatusBinding
import io.sablepay.sdk.polling.PaymentPoller
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

/**
 * Activity for checking payment status with auto-polling.
 */
class PaymentStatusActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPaymentStatusBinding
    private val viewModel: PaymentViewModel by viewModels()
    private val poller = PaymentPoller()
    private var pollingJob: Job? = null

    private lateinit var paymentId: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPaymentStatusBinding.inflate(layoutInflater)
        setContentView(binding.root)

        paymentId = intent.getStringExtra(EXTRA_PAYMENT_ID)
            ?: run {
                Toast.makeText(this, "Payment ID not provided", Toast.LENGTH_SHORT).show()
                finish()
                return
            }

        setupUI()
        observeStatusState()
        startPolling()
    }

    private fun setupUI() {
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            title = "Payment Status"
        }

        binding.apply {
            textPaymentId.text = "Payment ID: $paymentId"

            buttonRefresh.setOnClickListener {
                viewModel.checkStatus(paymentId)
            }

            switchAutoRefresh.setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) {
                    startPolling()
                } else {
                    stopPolling()
                }
            }
        }
    }

    private fun observeStatusState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.statusState.collect { state ->
                    updateUI(state)
                }
            }
        }
    }

    private fun updateUI(state: StatusState) {
        binding.apply {
            when (state) {
                is StatusState.Idle -> {
                    progressBar.visibility = View.GONE
                }

                is StatusState.Loading -> {
                    progressBar.visibility = View.VISIBLE
                }

                is StatusState.Success -> {
                    progressBar.visibility = View.GONE
                    val response = state.response

                    textStatus.text = "Status: ${response.status.uppercase()}"
                    textAmount.text = "Amount: ${formatAmount(response.amount)}"

                    // Update status indicator color
                    val statusColor = when {
                        response.isCompleted -> android.graphics.Color.GREEN
                        response.isFailed -> android.graphics.Color.RED
                        response.isExpired -> android.graphics.Color.GRAY
                        else -> android.graphics.Color.YELLOW
                    }
                    viewStatusIndicator.setBackgroundColor(statusColor)

                    // Show transaction hash if completed
                    if (response.txHash != null) {
                        textTxHash.text = "TX: ${response.txHash}"
                        textTxHash.visibility = View.VISIBLE
                    } else {
                        textTxHash.visibility = View.GONE
                    }

                    // Show completion time if available
                    if (response.completedAt != null) {
                        textCompletedAt.text = "Completed: ${response.completedAt}"
                        textCompletedAt.visibility = View.VISIBLE
                    } else {
                        textCompletedAt.visibility = View.GONE
                    }

                    // Show paid details if available
                    if (response.paidToken != null && response.paidAmount != null) {
                        textFailureReason.text = "Paid: ${response.paidAmount} ${response.paidToken}"
                        textFailureReason.visibility = View.VISIBLE
                    } else {
                        textFailureReason.visibility = View.GONE
                    }

                    // Stop polling if terminal state
                    if (response.isTerminal) {
                        stopPolling()
                        switchAutoRefresh.isChecked = false
                    }
                }

                is StatusState.Error -> {
                    progressBar.visibility = View.GONE
                    Toast.makeText(this@PaymentStatusActivity, state.message, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun startPolling() {
        pollingJob?.cancel()
        pollingJob = lifecycleScope.launch {
            poller.pollStatus(
                paymentId = paymentId,
                intervalMs = 3000,
                maxAttempts = 60
            ).collect { result ->
                result
                    .onSuccess { _ ->
                        viewModel.checkStatus(paymentId) // Update ViewModel state
                    }
                    .onFailure { _ ->
                        // Error already handled by ViewModel
                    }
            }
        }
    }

    private fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }

    private fun formatAmount(amount: Double): String {
        return String.format("$%.2f USD", amount)
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    override fun onDestroy() {
        super.onDestroy()
        stopPolling()
    }

    companion object {
        const val EXTRA_PAYMENT_ID = "extra_payment_id"
    }
}
