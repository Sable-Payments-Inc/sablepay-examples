import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SablePay,
  PaymentStatusResponse,
  isCompleted,
  isFailed,
  isExpired,
  isTerminal,
  formatAmount,
} from '@sablepay/angular-sablepay-js';

@Component({
  selector: 'app-payment-status-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2 class="card-title">Payment Status Lookup</h2>

      <div class="form-group">
        <label for="paymentId">Payment ID</label>
        <input
          id="paymentId"
          type="text"
          [(ngModel)]="paymentId"
          placeholder="Enter payment ID (UUID)"
          (keyup.enter)="lookupStatus()"
        />
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 16px">
        <button
          class="btn btn-primary"
          [disabled]="!paymentId.trim() || loading"
          (click)="lookupStatus()"
          style="flex: 1"
        >
          {{ loading ? 'Loading...' : 'Lookup Status' }}
        </button>

        <button
          class="btn btn-secondary"
          [disabled]="!paymentId.trim() || isPolling"
          (click)="togglePolling()"
          style="flex: 1"
        >
          {{ isPolling ? 'Stop Polling' : 'Start Polling' }}
        </button>
      </div>

      <p *ngIf="error" style="color: var(--error); font-size: 14px; margin-bottom: 16px">
        {{ error }}
      </p>

      <ng-container *ngIf="status">
        <div class="status-details">
          <div class="status-row">
            <span class="label">Payment ID</span>
            <span class="value">{{ status.paymentId }}</span>
          </div>
          <div class="status-row">
            <span class="label">Status</span>
            <span
              class="value"
              [class.success]="isCompletedStatus(status.status)"
              [class.error]="isFailedStatus(status.status) || isExpiredStatus(status.status)"
            >
              {{ status.status }}
            </span>
          </div>
          <div class="status-row">
            <span class="label">Amount</span>
            <span class="value">{{ formatAmountValue(status.amount) }}</span>
          </div>
          <div class="status-row" *ngIf="status.transactionId">
            <span class="label">Transaction ID</span>
            <span class="value">{{ status.transactionId }}</span>
          </div>
          <div class="status-row" *ngIf="status.paidToken">
            <span class="label">Paid Token</span>
            <span class="value">{{ status.paidToken }}</span>
          </div>
          <div class="status-row" *ngIf="status.paidNetwork">
            <span class="label">Network</span>
            <span class="value">{{ status.paidNetwork }}</span>
          </div>
          <div class="status-row" *ngIf="status.paidAmount != null">
            <span class="label">Paid Amount</span>
            <span class="value success">{{ status.paidAmount }}</span>
          </div>
          <div class="status-row">
            <span class="label">Created At</span>
            <span class="value">{{ status.createdAt }}</span>
          </div>
          <div class="status-row" *ngIf="status.completedAt">
            <span class="label">Completed At</span>
            <span class="value">{{ status.completedAt }}</span>
          </div>
          <div class="status-row" *ngIf="status.expiresAt">
            <span class="label">Expires At</span>
            <span class="value">{{ status.expiresAt }}</span>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class PaymentStatusPageComponent {
  paymentId = '';
  loading = false;
  status: PaymentStatusResponse | null = null;
  error = '';
  isPolling = false;
  private pollTimerId: ReturnType<typeof setTimeout> | null = null;

  async lookupStatus(): Promise<void> {
    if (!this.paymentId.trim()) return;
    this.loading = true;
    this.error = '';
    this.status = null;

    try {
      const sablePay = SablePay.getInstance();
      this.status = await sablePay.getPaymentStatus(this.paymentId.trim());
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      this.loading = false;
    }
  }

  togglePolling(): void {
    if (this.isPolling) {
      this.stopPolling();
    } else {
      this.startPolling();
    }
  }

  startPolling(): void {
    if (!this.paymentId.trim()) return;
    this.isPolling = true;

    const poll = async (): Promise<void> => {
      if (!this.isPolling) return;

      try {
        const sablePay = SablePay.getInstance();
        const resp = await sablePay.getPaymentStatus(this.paymentId.trim());
        this.status = resp;

        if (isTerminal(resp.status)) {
          this.isPolling = false;
          return;
        }
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : String(err);
      }

      if (this.isPolling) {
        this.pollTimerId = setTimeout(() => poll(), 3000);
      }
    };

    poll();
  }

  stopPolling(): void {
    this.isPolling = false;
    if (this.pollTimerId) {
      clearTimeout(this.pollTimerId);
      this.pollTimerId = null;
    }
  }

  isCompletedStatus(status: string): boolean {
    return isCompleted(status);
  }

  isFailedStatus(status: string): boolean {
    return isFailed(status);
  }

  isExpiredStatus(status: string): boolean {
    return isExpired(status);
  }

  formatAmountValue(amount: number): string {
    return formatAmount(amount);
  }
}
