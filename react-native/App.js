// ═══════════════════════════════════════════════════════════════════════════════
// SablePay React Native Example App
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SablePay } from '@sablepay/react-native-sablepay-js';
import environment from './src/config/environment';
import CoffeeShopScreen from './src/screens/CoffeeShopScreen';
import PaymentStatusScreen from './src/screens/PaymentStatusScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // home | status
  const envLabel = environment.sablepayBaseUrl.includes('sandbox') ? 'SANDBOX' : 'LIVE';

  useEffect(() => {
    const { sablepayApiKey, sablepayMerchantId, sablepayBaseUrl } = environment;

    if (
      !sablepayApiKey ||
      sablepayApiKey === 'YOUR_API_KEY_HERE' ||
      !sablepayMerchantId ||
      sablepayMerchantId === 'YOUR_MERCHANT_ID_HERE'
    ) {
      setInitError(
        'Missing configuration. Please update src/config/environment.js with your SablePay API key and Merchant ID.'
      );
      return;
    }

    try {
      if (!SablePay.isInitialized()) {
        SablePay.initialize({
          apiKey: sablepayApiKey,
          merchantId: sablepayMerchantId,
          baseUrl: sablepayBaseUrl,
          enableLogging: !environment.production,
        });
      }
      setIsInitialized(true);
      console.log('[SablePay] Initialized —', SablePay.getInstance().getEnvironment());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setInitError(`Initialization failed: ${message}`);
    }

    return () => {
      try {
        SablePay.release();
      } catch (_) {
        // ignore if already released
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setActiveTab('home')}>
            <Text style={styles.headerTitle}>SablePay</Text>
          </TouchableOpacity>
          {isInitialized && (
            <View style={styles.envBadge}>
              <Text style={styles.envBadgeText}>{envLabel}</Text>
            </View>
          )}
          {initError && (
            <View style={[styles.envBadge, styles.envBadgeError]}>
              <Text style={styles.envBadgeText}>ERROR</Text>
            </View>
          )}
        </View>
        <View style={styles.nav}>
          <TouchableOpacity
            style={[styles.navBtn, activeTab === 'home' && styles.navBtnActive]}
            onPress={() => setActiveTab('home')}
          >
            <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>
              Home
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, activeTab === 'status' && styles.navBtnActive]}
            onPress={() => setActiveTab('status')}
          >
            <Text style={[styles.navText, activeTab === 'status' && styles.navTextActive]}>
              Status
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Config Warning ────────────────────────────────── */}
      {initError && (
        <View style={styles.configWarning}>
          <Text style={styles.configWarningText}>{initError}</Text>
        </View>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      <View style={styles.content}>
        {activeTab === 'home' ? <CoffeeShopScreen /> : <PaymentStatusScreen />}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  envBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  envBadgeError: {
    backgroundColor: 'rgba(239,68,68,0.3)',
  },
  envBadgeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  nav: {
    flexDirection: 'row',
    gap: 6,
  },
  navBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  navBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
  },
  navTextActive: {
    color: '#fff',
  },
  configWarning: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 0,
  },
  configWarningText: {
    fontSize: 14,
    color: '#92400e',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
