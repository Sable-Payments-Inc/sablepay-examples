# SablePay Web SDK Example

This example demonstrates integrating the SablePay React SDK (`@sablepay/react-sablepay-js`) in a Next.js application for stablecoin payments.

## Requirements

- Node.js 18+
- npm or yarn
- SablePay merchant account (sandbox or production)

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure Credentials

Create a `.env.local` file in the `web/` directory:

```env
PUBLIC_SABLEPAY_API_KEY=sable_sk_sand_YOUR_API_KEY
PUBLIC_SABLEPAY_MERCHANT_ID=00000000-0000-0000-0000-000000000000
PUBLIC_SABLEPAY_BASE_URL=https://sandbox-api.sablepay.io
```

### 3. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

| Page | Route | Description |
|------|-------|-------------|
| **Coffee Shop POS** | `/` | Create payments, generate QR codes, and poll for status |
| **Payment Status** | `/payment-status` | Look up payment status by ID with optional auto-polling |

## Integration

Add the SDK to your project:

```bash
npm install @sablepay/react-sablepay-js
```

### Initialize the SDK

```tsx
import { SablePay } from '@sablepay/react-sablepay-js';

SablePay.initialize({
  apiKey: 'sable_sk_sand_...',
  merchantId: 'your-merchant-uuid',
  baseUrl: 'https://sandbox-api.sablepay.io',
});
```

### Create a Payment

```tsx
import { SablePay, CreatePaymentRequest, QrCodeGenerator } from '@sablepay/react-sablepay-js';

const request: CreatePaymentRequest = {
  amount: 5,
  items: [{ name: 'Espresso', quantity: 1, amount: 5 }],
  metadata: { source: 'my-app' },
};

const response = await SablePay.getInstance().createPayment(request);

// Generate a QR code for the payment
const qrGen = new QrCodeGenerator();
const dataUrl = await qrGen.generatePaymentQr(response, { width: 280 });
```

### Check Payment Status

```tsx
const status = await SablePay.getInstance().getPaymentStatus(paymentId);
```

## Project Structure

```
web/
├── public/                         # Static assets
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with SablePayAppProvider
│   │   ├── page.tsx                # Coffee Shop POS demo
│   │   ├── globals.css             # App styles
│   │   └── payment-status/
│   │       └── page.tsx            # Payment status lookup
│   ├── components/
│   │   └── AppHeader.tsx           # Navigation header
│   └── providers/
│       └── SablePayAppProvider.tsx  # SDK initialization context
├── next.config.js                  # Next.js config (env vars & CORS proxy)
├── tsconfig.json
└── package.json
```

## CORS Proxy

The example uses Next.js rewrites to proxy API requests through the same origin, avoiding CORS issues in the browser. Requests to `/api/proxy/*` are forwarded to the configured `PUBLIC_SABLEPAY_BASE_URL`. See [next.config.js](./next.config.js) for details.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## More Information

See the [main README](../README.md) for the full integration guide and links to other platform examples.
