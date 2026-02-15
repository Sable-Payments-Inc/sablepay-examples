import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SablePay,
  CreatePaymentRequest,
  CreatePaymentResponse,
  PaymentStatusResponse,
  PaymentItem,
  isCompleted,
  isFailed,
  isExpired,
} from '@sablepay/angular-sablepay-js';
import * as QRCode from 'qrcode';

interface MenuItem {
  name: string;
  emoji: string;
  price: number;
}

type Step = 'menu' | 'creating' | 'qr' | 'success' | 'failed';

@Component({
  selector: 'app-coffee-shop',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2 class="card-title">&#9749; Coffee Shop POS</h2>

      <!-- Menu -->
      <ng-container *ngIf="step === 'menu'">
        <div class="menu-grid">
          <div
            *ngFor="let item of menu"
            class="menu-item"
            [class.selected]="selected.has(item.name)"
            (click)="toggleItem(item.name)"
          >
            <span class="emoji">{{ item.emoji }}</span>
            <span class="name">{{ item.name }}</span>
            <span class="price">\${{ item.price.toFixed(2) }}</span>
          </div>
        </div>

        <div class="order-summary">
          <div>
            <div class="order-label">Order Total</div>
            <div class="order-total">\${{ totalAmount.toFixed(2) }}</div>
          </div>
          <div style="font-size: 13px; color: var(--text-secondary)">
            {{ selected.size }} item{{ selected.size !== 1 ? 's' : '' }}
          </div>
        </div>

        <button
          class="btn btn-primary"
          [disabled]="totalAmount === 0"
          (click)="createPayment()"
        >
          Create Payment
        </button>
      </ng-container>

      <!-- Creating -->
      <ng-container *ngIf="step === 'creating'">
        <div style="text-align: center; padding: 40px">
          <div class="spinner dark large"></div>
          <p style="margin-top: 16px; color: var(--text-secondary)">
            Creating payment...
          </p>
        </div>
      </ng-container>

      <!-- QR Code / Awaiting Payment -->
      <ng-container *ngIf="step === 'qr' && payment">
        <div class="payment-result">
          <div class="amount">\${{ totalAmount.toFixed(2) }}</div>
          <div class="status pending">Awaiting Payment</div>
          <div class="payment-id">ID: {{ payment.paymentId }}</div>

          <div class="qr-container" *ngIf="qrUrl">
            <img [src]="qrUrl" alt="Payment QR Code" width="280" height="280" />
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 16px">
              <span style="font-size: 18px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.3px">SablePay</span>
            </div>
            <span class="scan-label">
              Scan to pay &middot; Polling for confirmation...
            </span>
          </div>

          <div style="margin-top: 12px">
            <div class="spinner dark" style="margin-right: 8px"></div>
            <span style="font-size: 13px; color: var(--text-secondary)">
              Checking status...
            </span>
          </div>

          <button class="btn btn-secondary btn-small" (click)="reset()" style="margin-top: 20px">
            Cancel
          </button>
        </div>
      </ng-container>

      <!-- Success -->
      <ng-container *ngIf="step === 'success'">
        <div class="payment-result">
          <div style="font-size: 48px; margin-bottom: 12px">&#10004;</div>
          <div class="amount">\${{ totalAmount.toFixed(2) }}</div>
          <div class="status completed">Payment Completed</div>
          <div class="payment-id" *ngIf="payment">ID: {{ payment.paymentId }}</div>

          <div class="status-details" *ngIf="paymentStatus">
            <div class="status-row" *ngIf="paymentStatus.transactionId">
              <span class="label">Transaction ID</span>
              <span class="value">{{ paymentStatus.transactionId }}</span>
            </div>
            <div class="status-row" *ngIf="paymentStatus.paidToken">
              <span class="label">Paid Token</span>
              <span class="value">{{ paymentStatus.paidToken }}</span>
            </div>
            <div class="status-row" *ngIf="paymentStatus.paidAmount != null">
              <span class="label">Paid Amount</span>
              <span class="value success">\${{ paymentStatus.paidAmount }}</span>
            </div>
          </div>

          <button class="btn btn-primary" (click)="reset()" style="margin-top: 20px">
            New Order
          </button>
        </div>
      </ng-container>

      <!-- Failed -->
      <ng-container *ngIf="step === 'failed'">
        <div class="payment-result">
          <div style="font-size: 48px; margin-bottom: 12px">&#10060;</div>
          <div class="amount">\${{ totalAmount.toFixed(2) }}</div>
          <div class="status failed">
            {{ paymentStatus && isExpiredStatus(paymentStatus.status) ? 'Payment Expired' : 'Payment Failed' }}
          </div>
          <p *ngIf="error" style="color: var(--error); font-size: 14px; margin-top: 12px">
            {{ error }}
          </p>
          <button class="btn btn-primary" (click)="reset()" style="margin-top: 20px">
            Try Again
          </button>
        </div>
      </ng-container>
    </div>
  `,
})
export class CoffeeShopComponent {
  menu: MenuItem[] = [
    { name: 'Espresso', emoji: '\u2615', price: 1 },
    { name: 'Latte', emoji: '\ud83e\udd5b', price: 1 },
    { name: 'Mocha', emoji: '\ud83c\udf6b', price: 1 },
    { name: 'Croissant', emoji: '\ud83e\udd50', price: 1 },
    { name: 'Muffin', emoji: '\ud83e\uddc1', price: 1 },
    { name: 'Cookie', emoji: '\ud83c\udf6a', price: 1 },
  ];

  selected = new Map<string, number>();
  step: Step = 'menu';
  payment: CreatePaymentResponse | null = null;
  paymentStatus: PaymentStatusResponse | null = null;
  qrUrl = '';
  error = '';

  get totalAmount(): number {
    let sum = 0;
    this.selected.forEach((qty, name) => {
      const item = this.menu.find((m) => m.name === name);
      if (item) sum += item.price * qty;
    });
    return sum;
  }

  toggleItem(name: string): void {
    if (this.selected.has(name)) {
      this.selected.delete(name);
    } else {
      this.selected.set(name, 1);
    }
    // Force change detection by creating a new Map
    this.selected = new Map(this.selected);
  }

  async createPayment(): Promise<void> {
    if (this.totalAmount === 0) return;
    this.step = 'creating';
    this.error = '';

    try {
      const sablePay = SablePay.getInstance();

      const items: PaymentItem[] = Array.from(this.selected.entries()).map(
        ([name, qty]) => {
          const menuItem = this.menu.find((m) => m.name === name)!;
          return {
            name: menuItem.name,
            quantity: qty,
            price: menuItem.price,
          };
        }
      );

      const request: CreatePaymentRequest = {
        amount: this.totalAmount,
        items,
        metadata: { source: 'angular-example-app-coffee-shop' },
      };

      const response = await sablePay.createPayment(request);
      this.payment = response;

      // Generate QR code directly using qrcode package
      if (response.paymentLink) {
        const dataUrl = await QRCode.toDataURL(response.paymentLink, {
          width: 280,
          margin: 4,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        });
        this.qrUrl = dataUrl;
      }
      this.step = 'qr';

      // Start polling
      this.pollStatus(response.paymentId);
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : String(err);
      this.step = 'failed';
    }
  }

  async pollStatus(paymentId: string): Promise<void> {
    const sablePay = SablePay.getInstance();

    const poll = async (): Promise<void> => {
      try {
        const statusResp = await sablePay.getPaymentStatus(paymentId);
        this.paymentStatus = statusResp;

        if (isCompleted(statusResp.status)) {
          this.step = 'success';
          return;
        }
        if (isFailed(statusResp.status) || isExpired(statusResp.status)) {
          this.step = 'failed';
          return;
        }
        // Still pending — poll again
        setTimeout(() => poll(), 3000);
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : String(err);
        this.step = 'failed';
      }
    };

    poll();
  }

  isExpiredStatus(status: string): boolean {
    return isExpired(status);
  }

  reset(): void {
    this.selected = new Map();
    this.step = 'menu';
    this.payment = null;
    this.paymentStatus = null;
    this.qrUrl = '';
    this.error = '';
  }
}
