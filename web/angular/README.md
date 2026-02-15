# SablePay Angular SDK Example

This example demonstrates integrating the SablePay Angular SDK (`@sablepay/angular-sablepay-js`) in an Angular 17+ application for stablecoin payments.

## Requirements

- Node.js 18+
- npm or yarn
- Angular CLI 17+
- SablePay merchant account (sandbox or production)

## Quick Start

### 1. Install Dependencies

```bash
cd web/angular
npm install
```

### 2. Configure Credentials

Edit `src/environments/environment.ts` with your SablePay credentials:

```typescript
export const environment = {
  production: false,
  sablepayApiKey: 'sable_sk_sand_YOUR_API_KEY',
  sablepayMerchantId: '00000000-0000-0000-0000-000000000000',
  sablepayBaseUrl: 'https://sandbox-api.sablepay.io/api/v1/',
};
```

### 3. Run the Dev Server

```bash
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

## Features

| Page | Route | Description |
|------|-------|-------------|
| **Coffee Shop POS** | `/` | Create payments, generate QR codes, and poll for status |
| **Payment Status** | `/payment-status` | Look up payment status by ID with optional auto-polling |

## Integration

Add the SDK to your project:

```bash
npm install @sablepay/angular-sablepay-js
```

### Initialize the SDK

Initialize in your root `AppComponent`:

```typescript
import { SablePay } from '@sablepay/angular-sablepay-js';
import { environment } from '../environments/environment';

export class AppComponent implements OnInit {
  ngOnInit(): void {
    SablePay.initialize({
      apiKey: environment.sablepayApiKey,
      merchantId: environment.sablepayMerchantId,
      baseUrl: environment.sablepayBaseUrl,
    });
  }
}
```

### Create a Payment

```typescript
import {
  SablePay,
  CreatePaymentRequest,
  PaymentItem,
} from '@sablepay/angular-sablepay-js';
import * as QRCode from 'qrcode';

const items: PaymentItem[] = [
  { name: 'Espresso', quantity: 1, amount: 5 },
];

const request: CreatePaymentRequest = {
  amount: 5,
  items,
  metadata: { source: 'angular-app' },
};

const response = await SablePay.getInstance().createPayment(request);

// Generate a QR code for the payment
const qrUrl = await QRCode.toDataURL(response.linkToken!, { width: 280 });
```

### Check Payment Status

```typescript
import {
  SablePay,
  isCompleted,
  isFailed,
  isExpired,
} from '@sablepay/angular-sablepay-js';

const status = await SablePay.getInstance().getPaymentStatus(paymentId);

if (isCompleted(status.status)) {
  // Payment successful
} else if (isFailed(status.status) || isExpired(status.status)) {
  // Payment failed or expired
}
```

## Project Structure

```
web/angular/
├── src/
│   ├── app/
│   │   ├── app.component.ts              # Root component with SDK init
│   │   ├── app.config.ts                 # Application config & providers
│   │   ├── app.routes.ts                 # Route definitions
│   │   ├── coffee-shop/
│   │   │   └── coffee-shop.component.ts  # Coffee Shop POS demo
│   │   └── payment-status-page/
│   │       └── payment-status-page.component.ts  # Payment status lookup
│   ├── environments/
│   │   ├── environment.ts                # Dev config (credentials here)
│   │   └── environment.prod.ts           # Production config
│   ├── index.html                        # Entry HTML
│   ├── main.ts                           # Bootstrap
│   ├── styles.css                        # Global styles
│   └── proxy.conf.json                   # Dev proxy for CORS
├── angular.json                          # Angular CLI config
├── tsconfig.json
├── tsconfig.app.json
└── package.json
```

## CORS Proxy

The example uses the Angular CLI dev server proxy to forward API requests through the same origin, avoiding CORS issues in the browser. Requests to `/api/proxy/*` are forwarded to the configured SablePay base URL. See [proxy.conf.json](./src/proxy.conf.json) for details.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server (`ng serve`) |
| `npm run build` | Build for production |
| `npm run watch` | Build in watch mode |

## More Information

See the [main README](../../README.md) for the full integration guide and links to other platform examples.
