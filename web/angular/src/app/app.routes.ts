import { Routes } from '@angular/router';
import { CoffeeShopComponent } from './coffee-shop/coffee-shop.component';
import { PaymentStatusPageComponent } from './payment-status-page/payment-status-page.component';

export const routes: Routes = [
  { path: '', component: CoffeeShopComponent },
  { path: 'payment-status', component: PaymentStatusPageComponent },
];
