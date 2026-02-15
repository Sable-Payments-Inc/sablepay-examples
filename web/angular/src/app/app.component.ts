import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SablePay } from '@sablepay/angular-sablepay-js';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  template: `
    <header class="app-header">
      <h1 (click)="navigateHome()">
        SablePay
        <span class="env-badge" *ngIf="isInitialized">{{ envLabel }}</span>
        <span class="env-badge" *ngIf="initError" style="background: rgba(239,68,68,0.3)">ERROR</span>
      </h1>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
        <a routerLink="/payment-status" routerLinkActive="active">Status</a>
      </nav>
    </header>

    <main class="page-container">
      <div class="config-warning" *ngIf="initError">{{ initError }}</div>
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  isInitialized = false;
  initError: string | null = null;
  envLabel = 'SANDBOX';

  ngOnInit(): void {
    const { sablepayApiKey, sablepayMerchantId, sablepayBaseUrl } = environment;

    if (!sablepayApiKey || sablepayApiKey === 'YOUR_API_KEY_HERE' ||
        !sablepayMerchantId || sablepayMerchantId === 'YOUR_MERCHANT_ID_HERE') {
      this.initError =
        'Missing configuration. Please update src/environments/environment.ts with your SablePay API key and Merchant ID.';
      return;
    }

    try {
      // Use the proxy to avoid CORS during development
      const proxyBaseUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/proxy/`
        : sablepayBaseUrl;

      SablePay.initialize({
        apiKey: sablepayApiKey,
        merchantId: sablepayMerchantId,
        baseUrl: proxyBaseUrl,
        enableLogging: !environment.production,
      });
      this.isInitialized = true;
      this.envLabel = sablepayBaseUrl.includes('sandbox') ? 'SANDBOX' : 'LIVE';
      console.log('[SablePay] Initialized —', SablePay.getInstance().getEnvironment());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.initError = `Initialization failed: ${message}`;
    }
  }

  ngOnDestroy(): void {
    try {
      SablePay.release();
    } catch (_) {
      // ignore if already released
    }
  }

  navigateHome(): void {
    window.location.href = '/';
  }
}
