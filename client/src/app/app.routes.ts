import { Routes } from '@angular/router';
import { AdminGuard } from './services/admin.guard';
import { AuthGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home').then((module) => module.HomeComponent),
    title: 'Watchera India | Luxury Timepieces'
  },
  {
    path: 'collections',
    loadComponent: () =>
      import('./components/product-list/product-list').then(
        (module) => module.ProductListComponent
      ),
    title: 'Collections | Watchera India'
  },
  {
    path: 'collections/:category',
    loadComponent: () =>
      import('./components/product-list/product-list').then(
        (module) => module.ProductListComponent
      ),
    title: 'Category Collection | Watchera India'
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./components/product-detail/product-detail').then(
        (module) => module.ProductDetailComponent
      ),
    title: 'Timepiece Detail | Watchera India'
  },
  {
    path: 'journal',
    loadComponent: () =>
      import('./components/journal/journal').then((module) => module.JournalComponent),
    title: 'Journal | Watchera India'
  },
  {
    path: 'concierge',
    loadComponent: () =>
      import('./components/contact/contact').then((module) => module.ContactComponent),
    title: 'Concierge | Watchera India'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/auth/login.component').then((module) => module.LoginComponent),
    title: 'Sign In | Watchera India'
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/auth/register.component').then((module) => module.RegisterComponent),
    title: 'Create Account | Watchera India'
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./components/auth/forgot-password.component').then(
        (module) => module.ForgotPasswordComponent
      ),
    title: 'Password Recovery | Watchera India'
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./admin/admin-panel.component').then((module) => module.AdminPanelComponent),
    canActivate: [AdminGuard],
    title: 'Admin Panel | Watchera India'
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./components/wishlist/wishlist').then((module) => module.WishlistComponent),
    title: 'Wishlist | Watchera India'
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./components/checkout/checkout').then((module) => module.CheckoutComponent),
    canActivate: [AuthGuard],
    title: 'Checkout | Watchera India'
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./components/order/order').then((module) => module.OrdersComponent),
    canActivate: [AuthGuard],
    title: 'Orders | Watchera India'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/user-dashboard/user-dashboard').then(
        (module) => module.UserDashboardComponent
      ),
    canActivate: [AuthGuard],
    title: 'Dashboard | Watchera India'
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./components/static-page/static-page').then(
        (module) => module.StaticPageComponent
      ),
    data: { page: 'faq' },
    title: 'FAQ | Watchera India'
  },
  {
    path: 'tracking',
    loadComponent: () =>
      import('./components/static-page/static-page').then(
        (module) => module.StaticPageComponent
      ),
    data: { page: 'tracking' },
    title: 'Order Tracking | Watchera India'
  },
  {
    path: 'shipping',
    loadComponent: () =>
      import('./components/static-page/static-page').then(
        (module) => module.StaticPageComponent
      ),
    data: { page: 'shipping' },
    title: 'Shipping and Returns | Watchera India'
  },
  {
    path: 'warranty',
    loadComponent: () =>
      import('./components/static-page/static-page').then(
        (module) => module.StaticPageComponent
      ),
    data: { page: 'warranty' },
    title: 'Warranty | Watchera India'
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./components/static-page/static-page').then(
        (module) => module.StaticPageComponent
      ),
    data: { page: 'privacy' },
    title: 'Privacy Policy | Watchera India'
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./components/static-page/static-page').then(
        (module) => module.StaticPageComponent
      ),
    data: { page: 'terms' },
    title: 'Terms of Service | Watchera India'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
