// ═══════════════════════════════════════════════════════════════════════════════
// SablePay React Native Example App - Coffee Shop POS Screen
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
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
} from '@sablepay/react-native-sablepay-js';
import QRCode from 'react-native-qrcode-svg';

// ─── Menu Data ───────────────────────────────────────────────────────────────

const MENU = [
  { name: 'Espresso', emoji: '\u2615', price: 1 },
  { name: 'Latte', emoji: '\ud83e\udd5b', price: 1 },
  { name: 'Mocha', emoji: '\ud83c\udf6b', price: 1 },
  { name: 'Croissant', emoji: '\ud83e\udd50', price: 1 },
  { name: 'Muffin', emoji: '\ud83e\uddc1', price: 1 },
  { name: 'Cookie', emoji: '\ud83c\udf6a', price: 1 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function CoffeeShopScreen() {
  const [selected, setSelected] = useState(new Map());
  const [step, setStep] = useState('menu'); // menu | creating | qr | success | failed
  const [payment, setPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState('');

  const totalAmount = Array.from(selected.entries()).reduce((sum, [name, qty]) => {
    const item = MENU.find((m) => m.name === name);
    return item ? sum + item.price * qty : sum;
  }, 0);

  const toggleItem = useCallback((name) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.set(name, 1);
      }
      return next;
    });
  }, []);

  const createPayment = useCallback(async () => {
    if (totalAmount === 0) return;
    setStep('creating');
    setError('');

    try {
      const sablePay = SablePay.getInstance();

      const items = Array.from(selected.entries()).map(([name, qty]) => {
        const menuItem = MENU.find((m) => m.name === name);
        return {
          name: menuItem.name,
          quantity: qty,
          price: menuItem.price,
        };
      });

      const request = {
        amount: totalAmount,
        items,
        metadata: { source: 'react-native-example-app-coffee-shop' },
      };

      const response = await sablePay.createPayment(request);
      setPayment(response);
      setStep('qr');

      // Start polling
      pollStatus(response.paymentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('failed');
    }
  }, [totalAmount, selected]);

  const pollStatus = async (paymentId) => {
    const sablePay = SablePay.getInstance();

    const poll = async () => {
      try {
        const statusResp = await sablePay.getPaymentStatus(paymentId);
        setPaymentStatus(statusResp);

        if (isCompleted(statusResp.status)) {
          setStep('success');
          return;
        }
        if (isFailed(statusResp.status) || isExpired(statusResp.status)) {
          setStep('failed');
          return;
        }
        // Still pending — poll again
        setTimeout(() => poll(), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStep('failed');
      }
    };

    poll();
  };

  const reset = useCallback(() => {
    setSelected(new Map());
    setStep('menu');
    setPayment(null);
    setPaymentStatus(null);
    setError('');
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{'\u2615'} Coffee Shop POS</Text>

        {/* ── Menu ─────────────────────────────────────────────── */}
        {step === 'menu' && (
          <>
            <View style={styles.menuGrid}>
              {MENU.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.menuItem,
                    selected.has(item.name) && styles.menuItemSelected,
                  ]}
                  onPress={() => toggleItem(item.name)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.orderSummary}>
              <View>
                <Text style={styles.orderLabel}>ORDER TOTAL</Text>
                <Text style={styles.orderTotal}>${totalAmount.toFixed(2)}</Text>
              </View>
              <Text style={styles.orderCount}>
                {selected.size} item{selected.size !== 1 ? 's' : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, totalAmount === 0 && styles.btnDisabled]}
              onPress={createPayment}
              disabled={totalAmount === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>Create Payment</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Creating ────────────────────────────────────────── */}
        {step === 'creating' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1a1a2e" />
            <Text style={styles.textSecondary}>Creating payment...</Text>
          </View>
        )}

        {/* ── QR Code / Awaiting Payment ──────────────────────── */}
        {step === 'qr' && payment && (
          <View style={styles.paymentResult}>
            <Text style={styles.amount}>${totalAmount.toFixed(2)}</Text>
            <View style={[styles.statusBadge, styles.statusPending]}>
              <Text style={styles.statusPendingText}>Awaiting Payment</Text>
            </View>
            <Text style={styles.paymentId}>ID: {payment.paymentId}</Text>

            {payment.paymentLink ? (
              <View style={styles.qrContainer}>
                <QRCode
                  value={payment.paymentLink}
                  size={240}
                  color="#1a1a2e"
                  backgroundColor="#FFFFFF"
                />
                <Text style={styles.brandLabel}>SablePay</Text>
                <Text style={styles.scanLabel}>
                  Scan to pay · Polling for confirmation...
                </Text>
              </View>
            ) : null}

            <View style={styles.pollingRow}>
              <ActivityIndicator size="small" color="#1a1a2e" />
              <Text style={styles.pollingText}>Checking status...</Text>
            </View>

            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary, styles.btnSmall]}
              onPress={reset}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Success ─────────────────────────────────────────── */}
        {step === 'success' && (
          <View style={styles.paymentResult}>
            <Text style={styles.bigIcon}>{'\u2714'}</Text>
            <Text style={styles.amount}>${totalAmount.toFixed(2)}</Text>
            <View style={[styles.statusBadge, styles.statusCompleted]}>
              <Text style={styles.statusCompletedText}>Payment Completed</Text>
            </View>
            {payment && <Text style={styles.paymentId}>ID: {payment.paymentId}</Text>}

            {paymentStatus && (
              <View style={styles.statusDetails}>
                {paymentStatus.transactionId && (
                  <View style={styles.statusRow}>
                    <Text style={styles.label}>Transaction ID</Text>
                    <Text style={styles.value}>{paymentStatus.transactionId}</Text>
                  </View>
                )}
                {paymentStatus.paidToken && (
                  <View style={styles.statusRow}>
                    <Text style={styles.label}>Paid Token</Text>
                    <Text style={styles.value}>{paymentStatus.paidToken}</Text>
                  </View>
                )}
                {paymentStatus.paidAmount != null && (
                  <View style={styles.statusRow}>
                    <Text style={styles.label}>Paid Amount</Text>
                    <Text style={[styles.value, styles.valueSuccess]}>
                      ${paymentStatus.paidAmount}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { marginTop: 20 }]}
              onPress={reset}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>New Order</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Failed ──────────────────────────────────────────── */}
        {step === 'failed' && (
          <View style={styles.paymentResult}>
            <Text style={styles.bigIcon}>{'\u274C'}</Text>
            <Text style={styles.amount}>${totalAmount.toFixed(2)}</Text>
            <View style={[styles.statusBadge, styles.statusFailed]}>
              <Text style={styles.statusFailedText}>
                {paymentStatus && isExpired(paymentStatus.status)
                  ? 'Payment Expired'
                  : 'Payment Failed'}
              </Text>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { marginTop: 20 }]}
              onPress={reset}
              activeOpacity={0.8}
            >
              <Text style={styles.btnPrimaryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
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

  // Menu
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  menuItem: {
    width: '30%',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  menuItemSelected: {
    borderColor: '#1a1a2e',
    backgroundColor: '#f0f0ff',
  },
  emoji: { fontSize: 28, marginBottom: 8 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  itemPrice: { fontSize: 12, color: '#64748b', marginTop: 4 },

  // Order Summary
  orderSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  orderLabel: { fontSize: 12, color: '#64748b', letterSpacing: 0.5 },
  orderTotal: { fontSize: 26, fontWeight: '700', color: '#1a1a2e' },
  orderCount: { fontSize: 13, color: '#64748b' },

  // Buttons
  btn: {
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: '#1a1a2e' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnSecondaryText: { color: '#1a1a2e', fontSize: 13, fontWeight: '600' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.5 },

  // Payment Result
  paymentResult: { alignItems: 'center', paddingVertical: 16 },
  amount: { fontSize: 34, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 4 },
  statusPending: { backgroundColor: '#fef3c7' },
  statusPendingText: { fontSize: 13, fontWeight: '600', color: '#92400e' },
  statusCompleted: { backgroundColor: '#d1fae5' },
  statusCompletedText: { fontSize: 13, fontWeight: '600', color: '#065f46' },
  statusFailed: { backgroundColor: '#fee2e2' },
  statusFailedText: { fontSize: 13, fontWeight: '600', color: '#991b1b' },
  paymentId: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  // QR Code
  qrContainer: { marginTop: 20, alignItems: 'center' },
  qrImage: { width: 280, height: 280, borderRadius: 12 },
  brandLabel: { marginTop: 14, fontSize: 18, fontWeight: '700', color: '#1a1a2e', letterSpacing: -0.3 },
  scanLabel: { marginTop: 10, fontSize: 14, color: '#64748b' },

  // Polling
  pollingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  pollingText: { fontSize: 13, color: '#64748b' },

  // Status Details
  statusDetails: { marginTop: 16, width: '100%' },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  label: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  value: { fontSize: 14, color: '#1a1a2e', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 12 },
  valueSuccess: { color: '#10b981' },

  // Common
  center: { alignItems: 'center', paddingVertical: 40 },
  textSecondary: { marginTop: 16, fontSize: 14, color: '#64748b' },
  bigIcon: { fontSize: 48, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 14, marginTop: 12, textAlign: 'center' },
});
