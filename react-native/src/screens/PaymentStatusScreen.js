// ═══════════════════════════════════════════════════════════════════════════════
// SablePay React Native Example App - Payment Status Lookup Screen
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  SablePay,
  isCompleted,
  isFailed,
  isExpired,
  isTerminal,
  formatAmount,
} from '@sablepay/react-native-sablepay-js';

export default function PaymentStatusScreen() {
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const pollTimerRef = useRef(null);

  const lookupStatus = useCallback(async () => {
    if (!paymentId.trim()) return;
    setLoading(true);
    setError('');
    setStatus(null);

    try {
      const sablePay = SablePay.getInstance();
      const resp = await sablePay.getPaymentStatus(paymentId.trim());
      setStatus(resp);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  const togglePolling = useCallback(() => {
    if (isPolling) {
      stopPolling();
    } else {
      startPolling();
    }
  }, [isPolling, paymentId]);

  const startPolling = () => {
    if (!paymentId.trim()) return;
    setIsPolling(true);

    const poll = async () => {
      try {
        const sablePay = SablePay.getInstance();
        const resp = await sablePay.getPaymentStatus(paymentId.trim());
        setStatus(resp);

        if (isTerminal(resp.status)) {
          setIsPolling(false);
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }

      pollTimerRef.current = setTimeout(() => poll(), 3000);
    };

    poll();
  };

  const stopPolling = () => {
    setIsPolling(false);
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const getStatusColor = (s) => {
    if (isCompleted(s)) return styles.valueSuccess;
    if (isFailed(s) || isExpired(s)) return styles.valueError;
    return {};
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment Status Lookup</Text>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>PAYMENT ID</Text>
          <TextInput
            style={styles.input}
            value={paymentId}
            onChangeText={setPaymentId}
            placeholder="Enter payment ID (UUID)"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={lookupStatus}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnPrimary,
              styles.flex1,
              (!paymentId.trim() || loading) && styles.btnDisabled,
            ]}
            onPress={lookupStatus}
            disabled={!paymentId.trim() || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>
              {loading ? 'Loading...' : 'Lookup Status'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnSecondary,
              styles.flex1,
              !paymentId.trim() && styles.btnDisabled,
            ]}
            onPress={togglePolling}
            disabled={!paymentId.trim()}
            activeOpacity={0.7}
          >
            <Text style={styles.btnSecondaryText}>
              {isPolling ? 'Stop Polling' : 'Start Polling'}
            </Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isPolling && (
          <View style={styles.pollingIndicator}>
            <ActivityIndicator size="small" color="#1a1a2e" />
            <Text style={styles.pollingText}>Polling every 3s...</Text>
          </View>
        )}

        {status && (
          <View style={styles.statusDetails}>
            <StatusRow label="Payment ID" value={status.paymentId} />
            <StatusRow
              label="Status"
              value={status.status}
              valueStyle={getStatusColor(status.status)}
            />
            <StatusRow label="Amount" value={formatAmount(status.amount)} />
            {status.transactionId && (
              <StatusRow label="Transaction ID" value={status.transactionId} />
            )}
            {status.paidToken && (
              <StatusRow label="Paid Token" value={status.paidToken} />
            )}
            {status.paidNetwork && (
              <StatusRow label="Network" value={status.paidNetwork} />
            )}
            {status.paidAmount != null && (
              <StatusRow
                label="Paid Amount"
                value={`$${status.paidAmount}`}
                valueStyle={styles.valueSuccess}
              />
            )}
            <StatusRow label="Created At" value={status.createdAt} />
            {status.completedAt && (
              <StatusRow label="Completed At" value={status.completedAt} />
            )}
            {status.expiresAt && (
              <StatusRow label="Expires At" value={status.expiresAt} />
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatusRow({ label, value, valueStyle }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1a2e',
  },

  // Form
  formGroup: { marginBottom: 16 },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a2e',
    backgroundColor: '#fff',
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  flex1: { flex: 1 },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: '#1a1a2e' },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnSecondaryText: { color: '#1a1a2e', fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },

  // Polling
  pollingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pollingText: { fontSize: 13, color: '#64748b' },

  // Status Details
  statusDetails: { marginTop: 8 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  label: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  value: {
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  valueSuccess: { color: '#10b981' },
  valueError: { color: '#ef4444' },

  errorText: { color: '#ef4444', fontSize: 14, marginBottom: 16 },
});
