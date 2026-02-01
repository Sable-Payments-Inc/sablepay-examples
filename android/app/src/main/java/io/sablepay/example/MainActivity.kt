package io.sablepay.example

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.google.android.material.card.MaterialCardView
import io.sablepay.example.databinding.ActivityMainBinding
import io.sablepay.sdk.SablePay
import io.sablepay.sdk.api.ApiException
import io.sablepay.sdk.models.CreatePaymentRequest
import io.sablepay.sdk.polling.PaymentPoller
import io.sablepay.sdk.ui.QrCodeGenerator
import io.sablepay.sdk.ui.QrCodeConfig
import io.sablepay.sdk.utils.NetworkConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Coffee Shop POS Demo - Main activity demonstrating payment creation with the SablePay SDK.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val ITEM_PRICE = 1.00 // All items are $1
    }

    private lateinit var binding: ActivityMainBinding
    private val viewModel: PaymentViewModel by viewModels()
    private val poller = PaymentPoller()
    private val qrGenerator = QrCodeGenerator()
    private var pollingJob: Job? = null

    // Menu item cards and their selection state
    private val menuItems = mutableMapOf<Int, MenuItem>()

    data class MenuItem(
        val name: String,
        val price: Double = ITEM_PRICE,
        var isSelected: Boolean = false
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupMenuItems()
        setupUI()
        observePaymentState()
    }

    private fun setupMenuItems() {
        // Initialize menu items
        menuItems[R.id.cardEspresso] = MenuItem("Espresso")
        menuItems[R.id.cardLatte] = MenuItem("Latte")
        menuItems[R.id.cardCappuccino] = MenuItem("Cappuccino")
        menuItems[R.id.cardAmericano] = MenuItem("Americano")
        menuItems[R.id.cardMocha] = MenuItem("Mocha")
        menuItems[R.id.cardCroissant] = MenuItem("Croissant")

        // Set up click listeners for each menu item card
        binding.apply {
            setupMenuCard(cardEspresso)
            setupMenuCard(cardLatte)
            setupMenuCard(cardCappuccino)
            setupMenuCard(cardAmericano)
            setupMenuCard(cardMocha)
            setupMenuCard(cardCroissant)
        }
    }

    private fun setupMenuCard(card: MaterialCardView) {
        card.setOnClickListener {
            val menuItem = menuItems[card.id] ?: return@setOnClickListener
            menuItem.isSelected = !menuItem.isSelected
            card.isChecked = menuItem.isSelected
            
            // Update stroke width based on selection
            card.strokeWidth = if (menuItem.isSelected) 4 else 0
            
            updateOrderTotal()
        }
    }

    private fun updateOrderTotal() {
        val total = menuItems.values
            .filter { it.isSelected }
            .sumOf { it.price }
        
        binding.textOrderTotal.text = formatAmountDisplay(total)
        binding.buttonCreatePayment.isEnabled = total > 0
    }

    private fun setupUI() {
        binding.apply {
            // Initial state
            buttonCreatePayment.isEnabled = false
            updateOrderTotal()

            // Create payment button
            buttonCreatePayment.setOnClickListener {
                createPayment()
            }

            // Check status button
            buttonCheckStatus.setOnClickListener {
                viewModel.currentPaymentId?.let { paymentId ->
                    navigateToStatusScreen(paymentId)
                }
            }

            // New payment button
            buttonNewPayment.setOnClickListener {
                resetUI()
            }
        }
    }

    private fun createPayment() {
        val selectedItems = menuItems.values.filter { it.isSelected }
        if (selectedItems.isEmpty()) {
            showError("Please select at least one item")
            return
        }

        val amount = selectedItems.sumOf { it.price }
        val description = selectedItems.joinToString(", ") { it.name }

        val request = CreatePaymentRequest(
            amount = amount,
            metadata = mapOf(
                "source" to "coffee_shop_pos",
                "items" to description,
                "timestamp" to System.currentTimeMillis().toString()
            )
        )

        viewModel.createPayment(request)
    }

    private fun observePaymentState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.paymentState.collect { state ->
                    updateUI(state)
                }
            }
        }
    }

    private fun updateUI(state: PaymentState) {
        binding.apply {
            when (state) {
                is PaymentState.Idle -> {
                    progressBar.visibility = View.GONE
                    cardPaymentForm.visibility = View.VISIBLE
                    cardPaymentResult.visibility = View.GONE
                    buttonCreatePayment.isEnabled = menuItems.values.any { it.isSelected }
                }

                is PaymentState.Loading -> {
                    progressBar.visibility = View.VISIBLE
                    buttonCreatePayment.isEnabled = false
                }

                is PaymentState.Success -> {
                    progressBar.visibility = View.GONE
                    cardPaymentForm.visibility = View.GONE
                    cardPaymentResult.visibility = View.VISIBLE

                    // Safely handle paymentId (Gson can bypass Kotlin null safety)
                    @Suppress("USELESS_ELVIS")
                    val paymentId: String? = state.response.paymentId ?: null
                    
                    // Display business name from API response
                    textMerchantName.text = state.response.businessName
                    
                    // Display amount prominently
                    textPaymentAmount.text = formatAmountDisplay(state.response.amount)
                    textPaymentStatus.text = "Status: ${state.response.status.uppercase()}"
                    textPaymentId.text = "ID: ${paymentId?.take(8) ?: "N/A"}..."

                    // Generate QR code using SDK's QrCodeGenerator (off main thread)
                    state.response.paymentLink?.let { _ ->
                        // Load logo on main thread, then generate QR on background
                        val logoBitmap = qrGenerator.loadSablePayLogo(this@MainActivity)
                        
                        // Generate QR code on background thread for better performance
                        lifecycleScope.launch {
                            val bitmap = withContext(Dispatchers.Default) {
                                qrGenerator.generatePaymentQr(
                                    paymentResponse = state.response,
                                    config = QrCodeConfig(
                                        qrSize = 350,
                                        showMerchantName = false,
                                        showAmount = false,
                                        showScanInstruction = false,
                                        showSecuredBy = true // Show "Secured by SablePay" with logo
                                    ),
                                    logoBitmap = logoBitmap
                                )
                            }
                            if (bitmap != null) {
                                imageQrCode.setImageBitmap(bitmap)
                                imageQrCode.visibility = View.VISIBLE
                            } else {
                                imageQrCode.visibility = View.GONE
                                showError("Failed to generate QR code")
                            }
                        }
                    } ?: run {
                        // If no payment link, show message
                        imageQrCode.visibility = View.GONE
                        showError("QR code not available for this payment")
                    }

                    buttonCheckStatus.visibility = View.VISIBLE
                    buttonNewPayment.visibility = View.VISIBLE
                    
                    // Start background polling for payment status updates (only if paymentId is valid)
                    if (!paymentId.isNullOrBlank()) {
                        startPollingForPayment(paymentId)
                    }
                }

                is PaymentState.Error -> {
                    progressBar.visibility = View.GONE
                    buttonCreatePayment.isEnabled = menuItems.values.any { it.isSelected }
                    showError(state.message)
                }
            }
        }
    }

    private fun formatAmountDisplay(amount: Double): String {
        return String.format("$%.2f", amount)
    }

    private fun navigateToStatusScreen(paymentId: String) {
        val intent = Intent(this, PaymentStatusActivity::class.java).apply {
            putExtra(PaymentStatusActivity.EXTRA_PAYMENT_ID, paymentId)
        }
        startActivity(intent)
    }

    private fun resetUI() {
        stopPolling()
        viewModel.reset()
        
        // Clear all selections
        menuItems.forEach { (cardId, item) ->
            item.isSelected = false
            findViewById<MaterialCardView>(cardId)?.apply {
                isChecked = false
                strokeWidth = 0
            }
        }
        
        binding.apply {
            imageQrCode.visibility = View.GONE
            buttonCheckStatus.visibility = View.GONE
            buttonNewPayment.visibility = View.GONE
        }
        
        updateOrderTotal()
    }

    /**
     * Start background polling for payment status updates.
     * Automatically updates the UI when payment status changes.
     */
    private fun startPollingForPayment(paymentId: String) {
        stopPolling() // Cancel any existing polling
        
        pollingJob = lifecycleScope.launch {
            poller.pollStatus(
                paymentId = paymentId,
                intervalMs = NetworkConfig.DEFAULT_POLL_INTERVAL_MS,
                maxAttempts = 72
            ).collect { result ->
                result.onSuccess { statusResponse ->
                    // Update status text
                    binding.textPaymentStatus.text = "Status: ${statusResponse.status.uppercase()}"
                    
                    // Update status color based on state
                    val statusColor = when {
                        statusResponse.isCompleted -> android.graphics.Color.parseColor("#4CAF50") // Green
                        statusResponse.isFailed -> android.graphics.Color.parseColor("#F44336") // Red
                        statusResponse.isExpired -> android.graphics.Color.parseColor("#9E9E9E") // Gray
                        else -> android.graphics.Color.parseColor("#FF9800") // Orange for pending
                    }
                    binding.textPaymentStatus.setTextColor(statusColor)
                    
                    // Handle terminal states
                    when {
                        statusResponse.isCompleted -> {
                            stopPolling()
                            showPaymentSuccess(statusResponse.txHash)
                        }
                        statusResponse.isFailed -> {
                            stopPolling()
                            showError("Payment failed")
                        }
                        statusResponse.isExpired -> {
                            stopPolling()
                            showError("Payment expired")
                        }
                    }
                }.onFailure { error ->
                    // Don't stop polling on transient errors
                    error.printStackTrace()
                }
            }
        }
    }

    /**
     * Stop background polling.
     */
    private fun stopPolling() {
        pollingJob?.cancel()
        pollingJob = null
    }

    /**
     * Show payment success message with transaction hash.
     */
    private fun showPaymentSuccess(txHash: String?) {
        val message = if (txHash != null) {
            "Payment completed!\nTX: ${txHash.take(20)}..."
        } else {
            "Payment completed!"
        }
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopPolling()
    }

    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}
