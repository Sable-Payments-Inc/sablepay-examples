package io.sablepay.example

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import io.sablepay.sdk.SablePay
import io.sablepay.sdk.api.ApiException
import io.sablepay.sdk.models.CreatePaymentRequest
import io.sablepay.sdk.models.CreatePaymentResponse
import io.sablepay.sdk.models.PaymentStatusResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.IOException

/**
 * ViewModel for payment operations.
 */
class PaymentViewModel : ViewModel() {

    private val _paymentState = MutableStateFlow<PaymentState>(PaymentState.Idle)
    val paymentState: StateFlow<PaymentState> = _paymentState.asStateFlow()

    private val _statusState = MutableStateFlow<StatusState>(StatusState.Idle)
    val statusState: StateFlow<StatusState> = _statusState.asStateFlow()

    /**
     * Current payment ID for status checking.
     */
    var currentPaymentId: String? = null
        private set

    /**
     * Create a new payment.
     */
    fun createPayment(request: CreatePaymentRequest) {
        viewModelScope.launch {
            _paymentState.value = PaymentState.Loading

            SablePay.getInstance().createPayment(request)
                .onSuccess { response ->
                    currentPaymentId = response.paymentId
                    _paymentState.value = PaymentState.Success(response)
                }
                .onFailure { error ->
                    val message = when (error) {
                        is ApiException -> {
                            when (error.statusCode) {
                                401 -> "Authentication failed. Check your API credentials."
                                429 -> "Rate limit exceeded. Please try again in ${error.retryAfter ?: 60} seconds."
                                else -> error.message
                            }
                        }
                        is IOException -> "Network error. Please check your connection."
                        else -> error.message ?: "Unknown error occurred"
                    }
                    _paymentState.value = PaymentState.Error(message)
                }
        }
    }

    /**
     * Check payment status.
     */
    fun checkStatus(paymentId: String) {
        viewModelScope.launch {
            _statusState.value = StatusState.Loading

            SablePay.getInstance().getPaymentStatus(paymentId)
                .onSuccess { response ->
                    _statusState.value = StatusState.Success(response)
                }
                .onFailure { error ->
                    val message = when (error) {
                        is ApiException -> {
                            when (error.statusCode) {
                                404 -> "Payment not found"
                                else -> error.message
                            }
                        }
                        is IOException -> "Network error. Please check your connection."
                        else -> error.message ?: "Unknown error occurred"
                    }
                    _statusState.value = StatusState.Error(message)
                }
        }
    }

    /**
     * Reset to initial state.
     */
    fun reset() {
        currentPaymentId = null
        _paymentState.value = PaymentState.Idle
        _statusState.value = StatusState.Idle
    }

    override fun onCleared() {
        super.onCleared()
        // Cancel any pending operations
    }
}

/**
 * State for payment creation.
 */
sealed class PaymentState {
    object Idle : PaymentState()
    object Loading : PaymentState()
    data class Success(val response: CreatePaymentResponse) : PaymentState()
    data class Error(val message: String) : PaymentState()
}

/**
 * State for payment status.
 */
sealed class StatusState {
    object Idle : StatusState()
    object Loading : StatusState()
    data class Success(val response: PaymentStatusResponse) : StatusState()
    data class Error(val message: String) : StatusState()
}
