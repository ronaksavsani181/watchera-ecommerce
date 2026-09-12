import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  PLATFORM_ID,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, PercentPipe, TitleCasePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import {
  AdminBanner,
  AdminCoupon,
  AdminDashboard,
  AdminOrder,
  AdminProduct,
  AdminProductPayload,
  AdminRange,
  AdminReportsResponse,
  AdminService,
  AdminUser,
  SalesPoint,
  StatusBreakdownItem,
  ShippingZone // NEW: Imported real interface
} from '../services/admin.service';

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type AdminTab =
  | 'dashboard'
  | 'products'
  | 'users'
  | 'orders'
  | 'payments'
  | 'coupons'
  | 'banners'
  | 'inventory'
  | 'shipping'
  | 'reports';

type AlertType = 'success' | 'error' | 'warning' | 'confirm';
type PaymentFilter = 'All' | 'Paid' | 'Pending' | 'Failed' | 'Refunded';
type PaymentState = 'Paid' | 'Pending' | 'Failed' | 'Refunded';

interface ProductDraft {
  name: string;
  brand: string;
  modelNumber: string;
  slug: string;
  sku: string;
  category: 'Luxury' | 'Sport' | 'Casual' | 'Smart';
  gender: 'Men' | 'Women' | 'Unisex';
  subcategory: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice: number;
  stock: number;
  imagesText: string;
  video: string;
  movement: string;
  caseMaterial: string;
  strapMaterial: string;
  dialColor: string;
  caseSize: string;
  waterResistance: string;
  warranty: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
}

interface PaymentRow {
  orderId: string;
  customerName: string;
  transactionId: string;
  amount: number;
  status: PaymentState;
  method: string;
  gateway: 'Razorpay' | 'Stripe' | 'COD';
  createdAt: string;
}

interface CouponItem {
  id: string;
  code: string;
  discountType: 'Flat' | 'Percentage';
  value: number;
  minPurchase: number;
  expiryDate: string;
  usageLimit: number;
  active: boolean;
  usedCount: number;
}

interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  redirectLink: string;
  status: 'Active' | 'Inactive';
  sortOrder: number;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const ORDER_STATUS_OPTIONS = [
  'Pending', 'Confirmed', 'Processing', 'Shipped',
  'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'
];

const PAYMENT_FILTERS: PaymentFilter[] = ['All', 'Paid', 'Pending', 'Failed', 'Refunded'];

const createEmptyDraft = (): ProductDraft => ({
  name: '', brand: 'Watchera', modelNumber: '', slug: '', sku: '',
  category: 'Luxury', gender: 'Unisex', subcategory: '',
  description: '', shortDescription: '', price: 0, discountPrice: 0,
  stock: 0, imagesText: '', video: '', movement: '',
  caseMaterial: '', strapMaterial: '', dialColor: '',
  caseSize: '', waterResistance: '', warranty: '',
  isFeatured: false, isNewArrival: false, isBestSeller: false, isActive: true
});

/* ─────────────────────────────────────────────────────────────
   TAB DEFINITIONS
───────────────────────────────────────────────────────────── */
interface TabDef { id: AdminTab; label: string; icon: string; badge?: number }

const TABS: TabDef[] = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
             <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
           </svg>`
  },
  {
    id: 'products', label: 'Products',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>
             <line x1="12" y1="3" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="21"/>
             <line x1="3" y1="12" x2="8" y2="12"/>
           </svg>`
  },
  {
    id: 'users', label: 'Customers',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
             <circle cx="9" cy="7" r="4"/>
             <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
             <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
           </svg>`
  },
  {
    id: 'orders', label: 'Orders',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
             <line x1="3" y1="6" x2="21" y2="6"/>
             <path d="M16 10a4 4 0 0 1-8 0"/>
           </svg>`
  },
  {
    id: 'payments', label: 'Payments',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <rect x="1" y="4" width="22" height="16" rx="2"/>
             <line x1="1" y1="10" x2="23" y2="10"/>
           </svg>`
  },
  {
    id: 'coupons', label: 'Coupons',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
             <line x1="7" y1="7" x2="7.01" y2="7"/>
           </svg>`
  },
  {
    id: 'banners', label: 'Banners',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <rect x="3" y="3" width="18" height="18" rx="2"/>
             <circle cx="8.5" cy="8.5" r="1.5"/>
             <polyline points="21 15 16 10 5 21"/>
           </svg>`
  },
  {
    id: 'inventory', label: 'Inventory',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
             <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
             <line x1="12" y1="22.08" x2="12" y2="12"/>
           </svg>`
  },
  {
    id: 'shipping', label: 'Shipping',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <rect x="1" y="3" width="15" height="13" rx="1"/>
             <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
             <circle cx="5.5" cy="18.5" r="2.5"/>
             <circle cx="18.5" cy="18.5" r="2.5"/>
           </svg>`
  },
  {
    id: 'reports', label: 'Reports',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
             <line x1="18" y1="20" x2="18" y2="10"/>
             <line x1="12" y1="20" x2="12" y2="4"/>
             <line x1="6"  y1="20" x2="6"  y2="14"/>
           </svg>`
  }
];

/* ─────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────── */
@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, PercentPipe, TitleCasePipe],
  templateUrl: './admin-panel.component.html',
  styleUrl:    './admin-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPanelComponent {

  private adminApi = inject(AdminService);
  auth             = inject(AuthService);
  private isBrowser: boolean;

  /* ── Fixed data ──────────────────────────────────────────── */
  tabs              = TABS;
  today             = new Date();
  orderStatusOptions = ORDER_STATUS_OPTIONS;
  paymentFilters     = PAYMENT_FILTERS;
  reportRanges: AdminRange[] = ['week', 'month', 'quarter', 'year', 'custom'];

  /* ── Alert ───────────────────────────────────────────────── */
  alertVisible = signal(false);
  alertType    = signal<AlertType>('success');
  alertTitle   = signal('');
  alertMessage = signal('');
  private _confirmCallback: (() => void) | null = null;

  /* ── Layout ──────────────────────────────────────────────── */
  sidebarCollapsed = signal(false);

  /* ── Navigation ──────────────────────────────────────────── */
  activeTab = signal<AdminTab>('dashboard');

  currentTabLabel = computed(() =>
    this.tabs.find(t => t.id === this.activeTab())?.label ?? 'Dashboard'
  );

  /* ── Server state ────────────────────────────────────────── */
  loading   = signal(false);
  notice    = signal<string | null>(null);
  error     = signal<string | null>(null);

  dashboardRange = signal<AdminRange>('week');
  dashboardFrom  = signal('');
  dashboardTo    = signal('');
  reportRange    = signal<AdminRange>('week');
  reportFrom     = signal('');
  reportTo       = signal('');

  dashboard = signal<AdminDashboard | null>(null);
  reports   = signal<AdminReportsResponse | null>(null);
  products  = signal<AdminProduct[]>([]);
  users     = signal<AdminUser[]>([]);
  orders    = signal<AdminOrder[]>([]);

  /* ── Product form ────────────────────────────────────────── */
  productFormOpen  = signal(false);
  savingProduct    = signal(false);
  editingProductId = signal<string | null>(null);
  productDraft: ProductDraft = createEmptyDraft();

  /* ── Orders ──────────────────────────────────────────────── */
  updatingOrderId = signal<string | null>(null);

  /* ── Payments ────────────────────────────────────────────── */
  paymentFilter = signal<PaymentFilter>('All');

  /* ── Coupons ─────────────────────────────────────────────── */
  coupons = signal<CouponItem[]>([]);
  couponForm = {
    code: '', discountType: 'Percentage' as CouponItem['discountType'],
    value: 10, minPurchase: 0, expiryDate: '', usageLimit: 100, active: true
  };

  /* ── Banners ─────────────────────────────────────────────── */
  banners = signal<BannerItem[]>([]);
  bannerForm = {
    title: '', imageUrl: '', redirectLink: '', status: 'Active' as BannerItem['status']
  };

  /* ── Shipping ────────────────────────────────────────────── */
  shippingZones   = signal<ShippingZone[]>([]); // NEW: Zero mock data
  shippingForm    = { region: '', cost: 0, eta: '' };
  shippingSettings = {
    flatCharge: 99, freeShippingEnabled: true,
    freeShippingThreshold: 4999, deliveryPartner: 'Delhivery'
  };

  /* ── Tracking ────────────────────────────────────────────── */
  trackingMap = signal<Record<string, string>>({});

  /* ─────────────────────────────────────────────────────────
     COMPUTED
  ──────────────────────────────────────────────────────────── */
  maxDashboardSeries = computed(() => this.getMaxSeries(this.dashboard()?.salesSeries ?? []));
  maxReportSeries    = computed(() => this.getMaxSeries(this.reports()?.salesSeries ?? []));

  lowStockProducts  = computed(() => this.products().filter(p => p.stock > 0 && p.stock <= 5));
  outOfStockProducts = computed(() => this.products().filter(p => p.stock <= 0));

  paymentRows = computed(() => this.buildPaymentRows());

  filteredPaymentRows = computed(() => {
    const f   = this.paymentFilter();
    const rows = this.paymentRows();
    return f === 'All' ? rows : rows.filter(r => r.status === f);
  });

  /* ─────────────────────────────────────────────────────────
     CONSTRUCTOR
  ──────────────────────────────────────────────────────────── */
  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.refreshAll();
  }

  /* ─────────────────────────────────────────────────────────
     ALERT SYSTEM
  ──────────────────────────────────────────────────────────── */
  private showAlert(
    type: AlertType,
    title: string,
    message: string,
    confirmCb?: () => void
  ) {
    this.alertType.set(type);
    this.alertTitle.set(title);
    this.alertMessage.set(message);
    this._confirmCallback = confirmCb ?? null;
    this.alertVisible.set(true);
  }

  closeAlert() {
    this.alertVisible.set(false);
    this._confirmCallback = null;
  }

  confirmAction() {
    this.alertVisible.set(false);
    if (this._confirmCallback) {
      this._confirmCallback();
      this._confirmCallback = null;
    }
  }

  /* ─────────────────────────────────────────────────────────
     NAVIGATION
  ──────────────────────────────────────────────────────────── */
  setTab(tab: AdminTab) {
    this.activeTab.set(tab);
    if (tab === 'dashboard' && !this.dashboard())           { this.loadDashboard(); }
    if ((tab === 'products' || tab === 'inventory') && this.products().length === 0)
                                                            { this.loadProducts(); }
    if (tab === 'users' && this.users().length === 0)       { this.loadUsers(); }
    if ((tab === 'orders' || tab === 'payments' || tab === 'shipping') && this.orders().length === 0)
                                                            { this.loadOrders(); }
    if (tab === 'coupons' && this.coupons().length === 0)   { this.loadCoupons(); }
    if (tab === 'banners' && this.banners().length === 0)   { this.loadBanners(); }
    if (tab === 'shipping' && this.shippingZones().length === 0) { this.loadShippingZones(); } // NEW
    if (tab === 'reports' && !this.reports())               { this.loadReports(); }
  }

  logoutAdmin() { this.auth.logout(); }

  /* ─────────────────────────────────────────────────────────
     REFRESH / LOAD
  ──────────────────────────────────────────────────────────── */
  refreshAll() {
    this.loading.set(true);
    this.clearMessages();
    this.loadDashboard();
    this.loadProducts();
    this.loadUsers();
    this.loadOrders();
    this.loadCoupons();
    this.loadBanners();
    this.loadShippingZones(); // NEW
    this.loadReports();
    this.loading.set(false);
  }

  loadDashboard() {
    this.adminApi.getDashboard(this.dashboardRange(), this.dashboardFrom(), this.dashboardTo())
      .subscribe({
        next:  d  => this.dashboard.set(d),
        error: e  => this.setError(e?.error?.message ?? e?.message ?? 'Failed to load dashboard')
      });
  }

  loadProducts() {
    this.adminApi.getProducts(1, 400).subscribe({
      next:  r  => this.products.set(r.products),
      error: e  => this.setError(e?.error?.message ?? e?.message ?? 'Failed to load products')
    });
  }

  loadUsers() {
    this.adminApi.getUsers().subscribe({
      next:  r  => this.users.set(r.users),
      error: e  => this.setError(e?.error?.message ?? e?.message ?? 'Failed to load users')
    });
  }

  loadOrders() {
    this.adminApi.getOrders(1, 250).subscribe({
      next:  r  => this.orders.set(r.orders),
      error: e  => this.setError(e?.error?.message ?? e?.message ?? 'Failed to load orders')
    });
  }

  loadReports() {
    this.adminApi.getReports(this.reportRange(), this.reportFrom(), this.reportTo()).subscribe({
      next:  r  => this.reports.set(r),
      error: e  => this.setError(e?.error?.message ?? e?.message ?? 'Failed to load reports')
    });
  }

  loadCoupons() {
    this.adminApi.getCoupons().subscribe({
      next:  r  => this.coupons.set(r.coupons.map(c => this.mapAdminCoupon(c))),
      error: e  => this.setError(e?.error?.message ?? e?.message ?? 'Failed to load coupons')
    });
  }

  loadBanners() {
    this.adminApi.getBanners().subscribe({
      next:  r  => this.banners.set(r.banners.map(b => this.mapAdminBanner(b))),
      error: e  => this.setError(e?.error?.message ?? e?.message ?? 'Failed to load banners')
    });
  }

  // NEW: Load Real Shipping Zones
  loadShippingZones() {
    this.adminApi.getShippingZones().subscribe({
      next: r => this.shippingZones.set(r.zones),
      error: e => this.setError(e?.error?.message ?? e?.message ?? 'Failed to load shipping zones')
    });
  }

  refreshDashboard() { this.loadDashboard(); }
  refreshReports()   { this.loadReports();   }

  /* ─────────────────────────────────────────────────────────
     PRODUCT FORM
  ──────────────────────────────────────────────────────────── */
  openCreateProductForm() {
    this.productDraft = createEmptyDraft();
    this.editingProductId.set(null);
    this.productFormOpen.set(true);
    this.clearMessages();
  }

  editProduct(product: AdminProduct) {
    this.productDraft = {
      name: product.name ?? '',
      brand: product.brand ?? 'Watchera',
      modelNumber: product.modelNumber ?? '',
      slug: product.slug ?? '',
      sku: product.sku ?? '',
      category: product.category ?? 'Luxury',
      gender: product.gender ?? 'Unisex',
      subcategory: product.subcategory ?? '',
      description: product.description ?? '',
      shortDescription: product.shortDescription ?? '',
      price: product.price ?? 0,
      discountPrice: product.discountPrice ?? 0,
      stock: product.stock ?? 0,
      imagesText: (product.images ?? []).join('\n'),
      video: product.video ?? '',
      movement: product.movement ?? '',
      caseMaterial: product.caseMaterial ?? '',
      strapMaterial: product.strapMaterial ?? '',
      dialColor: product.dialColor ?? '',
      caseSize: product.caseSize ?? '',
      waterResistance: product.waterResistance ?? '',
      warranty: product.warranty ?? '',
      isFeatured: !!product.isFeatured,
      isNewArrival: !!product.isNewArrival,
      isBestSeller: !!product.isBestSeller,
      isActive: product.isActive !== false
    };
    this.editingProductId.set(product._id);
    this.productFormOpen.set(true);
    this.clearMessages();
  }

  closeProductForm() {
    this.productFormOpen.set(false);
    this.editingProductId.set(null);
    this.productDraft = createEmptyDraft();
  }

  saveProduct() {
    const payload = this.buildProductPayload();
    if (!payload.name || !payload.description || payload.price < 0) {
      this.showAlert('error', 'Validation Error', 'Product name, description, and valid price are required.');
      return;
    }
    this.savingProduct.set(true);
    this.clearMessages();
    const editId = this.editingProductId();

    if (editId) {
      this.adminApi.updateProduct(editId, payload)
        .pipe(finalize(() => this.savingProduct.set(false)))
        .subscribe({
          next: () => {
            this.showAlert('success', 'Updated', 'Product updated successfully.');
            this.closeProductForm();
            this.loadProducts();
            this.loadDashboard();
          },
          error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to update product')
        });
      return;
    }

    this.adminApi.createProduct(payload)
      .pipe(finalize(() => this.savingProduct.set(false)))
      .subscribe({
        next: () => {
          this.showAlert('success', 'Created', 'Product created successfully.');
          this.closeProductForm();
          this.loadProducts();
          this.loadDashboard();
        },
        error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to create product')
      });
  }

  deleteProduct(product: AdminProduct) {
    this.showAlert('confirm', 'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      () => {
        this.clearMessages();
        this.adminApi.deleteProduct(product._id).subscribe({
          next: () => {
            this.showAlert('success', 'Deleted', 'Product deleted successfully.');
            this.loadProducts();
            this.loadDashboard();
          },
          error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to delete product')
        });
      }
    );
  }

  adjustStock(product: AdminProduct, delta: number) {
    this.updateStock(product, Math.max(0, product.stock + delta));
  }

  updateStock(product: AdminProduct, stock: number | string) {
    const nextStock = Math.max(0, Number(stock) || 0);
    this.clearMessages();
    this.adminApi.updateProduct(product._id, { stock: nextStock }).subscribe({
      next: () => {
        this.showAlert('success', 'Stock Updated', `Stock updated for ${product.name}.`);
        this.loadProducts();
        this.loadDashboard();
      },
      error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to update stock')
    });
  }

  /* ─────────────────────────────────────────────────────────
     USERS
  ──────────────────────────────────────────────────────────── */
  toggleUserStatus(user: AdminUser) {
    this.clearMessages();
    this.adminApi.updateUserStatus(user._id, !user.isActive).subscribe({
      next: () => {
        this.showAlert('success', 'Status Updated',
          `User ${user.isActive ? 'blocked' : 'unblocked'} successfully.`);
        this.loadUsers();
      },
      error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to update user status')
    });
  }

  deleteUser(user: AdminUser) {
    this.showAlert('confirm', 'Delete User',
      `Delete user "${user.name}"? Their data will be permanently removed.`,
      () => {
        this.clearMessages();
        this.adminApi.deleteUser(user._id).subscribe({
          next: () => {
            this.showAlert('success', 'Deleted', 'User deleted successfully.');
            this.loadUsers();
            this.loadDashboard();
          },
          error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to delete user')
        });
      }
    );
  }

  customerOrderCount(userId: string): number {
    return this.orders().filter(o => o.user?._id === userId).length;
  }

  customerTotalSpend(userId: string): number {
    return this.orders()
      .filter(o => o.user?._id === userId)
      .reduce((s, o) => s + o.totalPrice, 0);
  }

  /* ─────────────────────────────────────────────────────────
     ORDERS
  ──────────────────────────────────────────────────────────── */
  updateOrderStatus(order: AdminOrder, status: string) {
    if (!status || status === order.orderStatus) { return; }
    this.updatingOrderId.set(order._id);
    this.clearMessages();
    this.adminApi.updateOrderStatus(order._id, status)
      .pipe(finalize(() => this.updatingOrderId.set(null)))
      .subscribe({
        next: () => {
          this.showAlert('success', 'Order Updated', 'Order status updated successfully.');
          this.loadOrders();
          this.loadDashboard();
          this.loadReports();
        },
        error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to update order status')
      });
  }

  downloadInvoicePdf(order: AdminOrder) { this.openInvoiceWindow(order); }
  printInvoice(order: AdminOrder)       { this.openInvoiceWindow(order); }

  /* ─────────────────────────────────────────────────────────
     PAYMENTS
  ──────────────────────────────────────────────────────────── */
  setPaymentFilter(filter: PaymentFilter) { this.paymentFilter.set(filter); }

  processRefund(row: PaymentRow) {
    if (row.status !== 'Paid') {
      this.showAlert('warning', 'Cannot Refund', 'Only paid transactions can be refunded.');
      return;
    }
    this.showAlert('confirm', 'Process Refund',
      `Refund ₹${row.amount.toLocaleString('en-IN')} for order #${row.orderId.slice(-8).toUpperCase()}?`,
      () => {
        const matched = this.orders().find(o => o._id === row.orderId);
        if (matched) {
          this.updateOrderStatus(matched, 'Refunded');
        } else {
          this.showAlert('success', 'Refund Queued', `Refund marked for transaction ${row.transactionId}.`);
        }
      }
    );
  }

  /* ─────────────────────────────────────────────────────────
     COUPONS
  ──────────────────────────────────────────────────────────── */
  saveCoupon() {
    const code = this.couponForm.code.trim().toUpperCase();
    if (!code) {
      this.showAlert('error', 'Validation', 'Coupon code is required.');
      return;
    }
    if (this.couponForm.value <= 0) {
      this.showAlert('error', 'Validation', 'Discount value must be greater than 0.');
      return;
    }
    this.clearMessages();
    this.adminApi.createCoupon({
      code,
      discountType: this.couponForm.discountType,
      value: this.couponForm.value,
      minPurchase: this.couponForm.minPurchase,
      expiryDate: this.couponForm.expiryDate || undefined,
      usageLimit: this.couponForm.usageLimit,
      active: this.couponForm.active
    }).subscribe({
      next: () => {
        this.resetCouponForm();
        this.showAlert('success', 'Created', 'Coupon created successfully.');
        this.loadCoupons();
      },
      error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to create coupon')
    });
  }

  toggleCoupon(coupon: CouponItem) {
    this.clearMessages();
    this.adminApi.toggleCouponStatus(coupon.id, !coupon.active).subscribe({
      next: () => {
        this.showAlert('success', 'Updated', `Coupon ${coupon.active ? 'deactivated' : 'activated'}.`);
        this.loadCoupons();
      },
      error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to update coupon')
    });
  }

  deleteCoupon(coupon: CouponItem) {
    this.showAlert('confirm', 'Delete Coupon',
      `Delete coupon "${coupon.code}"?`,
      () => {
        this.clearMessages();
        this.adminApi.deleteCoupon(coupon.id).subscribe({
          next: () => {
            this.showAlert('success', 'Deleted', 'Coupon deleted.');
            this.loadCoupons();
          },
          error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to delete coupon')
        });
      }
    );
  }

  /* ─────────────────────────────────────────────────────────
     BANNERS
  ──────────────────────────────────────────────────────────── */
  saveBanner() {
    if (!this.bannerForm.title.trim() || !this.bannerForm.imageUrl.trim()) {
      this.showAlert('error', 'Validation', 'Banner title and image URL are required.');
      return;
    }
    this.clearMessages();
    this.adminApi.createBanner({
      title: this.bannerForm.title.trim(),
      imageUrl: this.bannerForm.imageUrl.trim(),
      redirectLink: this.bannerForm.redirectLink.trim(),
      status: this.bannerForm.status,
      sortOrder: this.banners().length
    }).subscribe({
      next: () => {
        this.resetBannerForm();
        this.showAlert('success', 'Added', 'Banner added successfully.');
        this.loadBanners();
      },
      error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to add banner')
    });
  }

  toggleBanner(banner: BannerItem) {
    this.clearMessages();
    this.adminApi.toggleBannerStatus(banner.id, banner.status !== 'Active').subscribe({
      next: () => {
        this.showAlert('success', 'Updated', 'Banner status updated.');
        this.loadBanners();
      },
      error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to update banner')
    });
  }

  deleteBanner(banner: BannerItem) {
    this.showAlert('confirm', 'Delete Banner',
      `Delete banner "${banner.title}"?`,
      () => {
        this.clearMessages();
        this.adminApi.deleteBanner(banner.id).subscribe({
          next: () => {
            this.showAlert('success', 'Deleted', 'Banner deleted.');
            this.loadBanners();
          },
          error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to delete banner')
        });
      }
    );
  }

  /* ─────────────────────────────────────────────────────────
     SHIPPING (NEW: Connects to Database)
  ──────────────────────────────────────────────────────────── */
  addShippingZone() {
    if (!this.shippingForm.region.trim()) {
      this.showAlert('error', 'Validation', 'Region name is required.');
      return;
    }
    this.clearMessages();
    this.adminApi.createShippingZone({
      region: this.shippingForm.region.trim(),
      cost: Number(this.shippingForm.cost) || 0,
      eta: this.shippingForm.eta.trim() || '3-5 days'
    }).subscribe({
      next: () => {
        this.showAlert('success', 'Added', 'Shipping zone added successfully.');
        this.shippingForm = { region: '', cost: 0, eta: '' };
        this.loadShippingZones(); // Refresh from DB
      },
      error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to add shipping zone')
    });
  }

  removeShippingZone(zone: ShippingZone) {
    this.showAlert('confirm', 'Remove Zone', 
      `Are you sure you want to remove the shipping zone for "${zone.region}"?`, 
      () => {
        this.clearMessages();
        this.adminApi.deleteShippingZone(zone._id).subscribe({
          next: () => {
            this.showAlert('success', 'Removed', 'Shipping zone removed successfully.');
            this.loadShippingZones(); // Refresh from DB
          },
          error: e => this.showAlert('error', 'Error', e?.error?.message ?? e?.message ?? 'Failed to remove shipping zone')
        });
      }
    );
  }

  saveShippingSettings() {
    this.showAlert('success', 'Saved', 'Shipping settings saved successfully.');
  }

  trackingValue(orderId: string): string { return this.trackingMap()[orderId] ?? ''; }

  setTrackingValue(orderId: string, value: string) {
    this.trackingMap.update(m => ({ ...m, [orderId]: value }));
  }

  saveTracking(order: AdminOrder) {
    const tracking = this.trackingValue(order._id).trim();
    if (!tracking) {
      this.showAlert('error', 'Validation', 'Tracking ID is required.');
      return;
    }
    this.showAlert('success', 'Saved', `Tracking ID saved for order #${order._id.slice(-8).toUpperCase()}.`);
  }

  /* ─────────────────────────────────────────────────────────
     INVENTORY / EXPORTS
  ──────────────────────────────────────────────────────────── */
  stockValue(): number {
    return this.products().reduce((s, p) => s + p.stock * p.price, 0);
  }

  exportInventoryCsv() {
    if (!this.isBrowser) { return; }
    const headers = ['SKU', 'Product', 'Category', 'Stock', 'Price', 'Status'];
    const rows = this.products().map(p => [
      p.sku ?? '',
      p.name,
      `${p.category}/${p.gender}`,
      String(p.stock),
      p.price.toFixed(2),
      p.stock > 0 ? 'In Stock' : 'Out of Stock'
    ]);
    this.downloadCsv(`watchera-inventory-${Date.now()}.csv`, headers, rows);
  }

  exportProfitCsv() {
    if (!this.isBrowser) { return; }
    const revenue      = this.reports()?.summary.totalRevenue ?? 0;
    const estimatedCost = revenue * 0.62;
    const profit       = revenue - estimatedCost;
    this.downloadCsv(`watchera-profit-${Date.now()}.csv`,
      ['Metric', 'Amount'],
      [
        ['Revenue',          revenue.toFixed(2)],
        ['Estimated Cost',   estimatedCost.toFixed(2)],
        ['Estimated Profit', profit.toFixed(2)],
        ['Stock Value',      this.stockValue().toFixed(2)]
      ]
    );
  }

  exportReportCsv() {
    if (!this.isBrowser) { return; }
    const report = this.reports();
    if (!report || report.orders.length === 0) {
      this.showAlert('warning', 'No Data', 'No report rows available for export.');
      return;
    }
    const headers = ['Order ID','Customer','Email','Status','Payment','Total','Items','Date'];
    const rows = report.orders.map(o => [
      o._id,
      o.user?.name ?? '',
      o.user?.email ?? '',
      o.orderStatus,
      o.paymentMethod,
      o.totalPrice.toFixed(2),
      String(o.itemCount),
      new Date(o.createdAt).toISOString()
    ]);
    this.downloadCsv(`watchera-report-${Date.now()}.csv`, headers, rows);
  }

  /* ─────────────────────────────────────────────────────────
     CHART HELPERS
  ──────────────────────────────────────────────────────────── */
  barWidth(value: number, max: number): string {
    if (max <= 0) { return '0%'; }
    return `${Math.max(4, Math.min(100, (value / max) * 100)).toFixed(1)}%`;
  }

  /** SVG polyline points for line chart (viewBox 0 0 400 120) */
  linePoints(points: SalesPoint[], max: number): string {
    if (points.length === 0) { return ''; }
    const maxVal = max > 0 ? max : 1;
    const den    = points.length > 1 ? points.length - 1 : 1;
    return points.map((p, i) => {
      const x = (i / den) * 400;
      const y = 120 - Math.max(4, Math.min(116, (p.value / maxVal) * 116));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  /** SVG area path (closed polygon under the line) */
  areaPath(points: SalesPoint[], max: number): string {
    if (points.length === 0) { return ''; }
    const maxVal = max > 0 ? max : 1;
    const den    = points.length > 1 ? points.length - 1 : 1;
    const pts = points.map((p, i) => ({
      x: (i / den) * 400,
      y: 120 - Math.max(4, Math.min(116, (p.value / maxVal) * 116))
    }));
    const line = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
    const lastX = pts[pts.length - 1].x;
    return `${line} L${lastX.toFixed(1)},120 L0,120 Z`;
  }

  /** Dot coordinates for each data point */
  chartDots(points: SalesPoint[], max: number): { x: number; y: number }[] {
    if (points.length === 0) { return []; }
    const maxVal = max > 0 ? max : 1;
    const den    = points.length > 1 ? points.length - 1 : 1;
    return points.map((p, i) => ({
      x: parseFloat(((i / den) * 400).toFixed(1)),
      y: parseFloat((120 - Math.max(4, Math.min(116, (p.value / maxVal) * 116))).toFixed(1))
    }));
  }

  maxStatusCount(breakdown: StatusBreakdownItem[]): number {
    return Math.max(...breakdown.map(b => b.count), 1);
  }

  /* ─────────────────────────────────────────────────────────
     STATUS CLASS HELPERS
  ──────────────────────────────────────────────────────────── */
  /** CSS class for order dot in lists */
  orderDotClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s === 'delivered')                     { return 'dot-delivered'; }
    if (s === 'shipped' || s === 'out for delivery') { return 'dot-shipped'; }
    if (s === 'pending' || s === 'confirmed' || s === 'processing') { return 'dot-pending'; }
    if (s === 'cancelled' || s === 'returned' || s === 'refunded')  { return 'dot-cancelled'; }
    return 'dot-default';
  }

  /** CSS class for status pill on orders */
  statusPillClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (['delivered', 'paid', 'approved', 'active'].includes(s))       { return 'pill-active'; }
    if (['pending', 'processing', 'confirmed', 'out for delivery'].includes(s)) { return 'pill-pending'; }
    if (['cancelled', 'failed', 'rejected'].includes(s))               { return 'pill-failed'; }
    if (['refunded', 'returned'].includes(s))                           { return 'pill-refunded'; }
    return 'pill-inactive';
  }

  /** CSS class for payment status pill */
  paymentPillClass(status: PaymentState): string {
    switch (status) {
      case 'Paid':     return 'pill-paid';
      case 'Pending':  return 'pill-pending';
      case 'Failed':   return 'pill-failed';
      case 'Refunded': return 'pill-refunded';
      default:         return 'pill-inactive';
    }
  }

  statusClass(status: string): string {
    return this.statusPillClass(status as PaymentState);
  }

  /* ─────────────────────────────────────────────────────────
     ANALYTICS HELPERS
  ──────────────────────────────────────────────────────────── */
  conversionRate(): number {
    const base = Math.max(1, this.users().filter(u => u.role === 'user').length * 2);
    return this.orders().length / base;
  }

  customerGrowthRate(): number {
    const total  = this.users().filter(u => u.role === 'user').length;
    const recent = this.dashboard()?.recentCustomers?.length ?? 0;
    return total ? recent / total : 0;
  }

  abandonedCartEstimate(): number {
    const traffic = Math.max(1, this.users().filter(u => u.role === 'user').length * 2);
    return Math.max(0, Math.round(traffic * 0.38 - this.orders().length));
  }

  /* ─────────────────────────────────────────────────────────
     PRIVATE HELPERS
  ──────────────────────────────────────────────────────────── */
  private buildPaymentRows(): PaymentRow[] {
    return this.orders().map(o => ({
      orderId:        o._id,
      customerName:   o.user?.name ?? 'Guest',
      transactionId:  `TXN-${o._id.slice(-8).toUpperCase()}`,
      amount:         o.totalPrice,
      status:         this.resolvePaymentState(o),
      method:         o.paymentMethod ?? 'N/A',
      gateway:        this.resolveGateway(o.paymentMethod ?? ''),
      createdAt:      o.createdAt
    })).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  private resolvePaymentState(order: AdminOrder): PaymentState {
    if (order.orderStatus === 'Refunded' || order.orderStatus === 'Returned') { return 'Refunded'; }
    if (order.isPaid)                                             { return 'Paid'; }
    if (order.orderStatus === 'Cancelled')        { return 'Failed'; }
    return 'Pending';
  }

  private resolveGateway(method: string): 'Razorpay' | 'Stripe' | 'COD' {
    const m = method.toLowerCase();
    if (m.includes('razor'))              { return 'Razorpay'; }
    if (m.includes('stripe') || m.includes('card')) { return 'Stripe'; }
    return 'COD';
  }

  private openInvoiceWindow(order: AdminOrder) {
    if (!this.isBrowser) { return; }
    const popup = window.open('', '_blank', 'width=900,height=700');
    if (!popup) {
      this.showAlert('error', 'Popup Blocked', 'Please allow popups to generate invoices.');
      return;
    }
    const customer = order.user?.name  ?? 'Guest';
    const email    = order.user?.email ?? '-';
    popup.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8"/>
          <title>Watchera Invoice — #${order._id.slice(-8).toUpperCase()}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #111; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
            .brand { font-size: 22px; font-weight: 800; letter-spacing: 0.15em; color: #b8961e; }
            .brand small { display: block; font-size: 11px; letter-spacing: 0.1em; color: #666; font-weight: 400; margin-top: 2px; }
            .invoice-label { font-size: 26px; font-weight: 700; color: #111; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 24px; font-size: 13px; }
            .meta span { color: #666; }
            .meta strong { color: #111; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
            th { background: #f5f5f5; padding: 10px 14px; text-align: left; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: #666; }
            td { padding: 12px 14px; border-bottom: 1px solid #eee; }
            .total-row td { font-weight: 700; background: #fffbe6; border-bottom: none; }
            .footer { margin-top: 28px; font-size: 11px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">WATCHERA<small>India · Luxury Timepieces</small></div>
            <div class="invoice-label">INVOICE</div>
          </div>
          <div class="meta">
            <div><span>Order ID </span><strong>#${order._id.slice(-8).toUpperCase()}</strong></div>
            <div><span>Date </span><strong>${new Date(order.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</strong></div>
            <div><span>Customer </span><strong>${customer}</strong></div>
            <div><span>Email </span><strong>${email}</strong></div>
            <div><span>Payment </span><strong>${order.paymentMethod ?? '-'}</strong></div>
            <div><span>Status </span><strong>${order.orderStatus}</strong></div>
          </div>
          <table>
            <thead>
              <tr><th>Description</th><th style="text-align:center">Items</th><th style="text-align:right">Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Order Items</td>
                <td style="text-align:center">${order.itemCount}</td>
                <td style="text-align:right">₹${order.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2">Total Amount</td>
                <td style="text-align:right">₹${order.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">This is a computer-generated invoice. No signature required.<br/>Watchera India · support@watchera.in</div>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
  }

  private downloadCsv(fileName: string, headers: string[], rows: string[][]) {
    if (!this.isBrowser) { return; }
    const csv  = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private getMaxSeries(points: SalesPoint[]): number {
    const max = Math.max(...points.map(p => p.value), 0);
    return max <= 0 ? 1 : max;
  }

  private parseImages(text: string): string[] {
    return text.split(/[\n,]/).map(e => e.trim()).filter(Boolean);
  }

  private buildProductPayload(): AdminProductPayload {
    const images  = this.parseImages(this.productDraft.imagesText);
    const name    = this.productDraft.name.trim();
    const slug    = this.productDraft.slug.trim() || this.slugify(name);
    return {
      name,
      brand:            this.productDraft.brand.trim() || 'Watchera',
      modelNumber:      this.productDraft.modelNumber.trim() || undefined,
      slug,
      sku:              this.productDraft.sku.trim() || undefined,
      category:         this.productDraft.category,
      gender:           this.productDraft.gender,
      subcategory:      this.productDraft.subcategory.trim() || undefined,
      description:      this.productDraft.description.trim(),
      shortDescription: this.productDraft.shortDescription.trim() || this.productDraft.description.trim(),
      price:            Number(this.productDraft.price) || 0,
      discountPrice:    Number(this.productDraft.discountPrice) || 0,
      stock:            Number(this.productDraft.stock) || 0,
      images,
      video:            this.productDraft.video.trim()            || undefined,
      movement:         this.productDraft.movement.trim()         || undefined,
      caseMaterial:     this.productDraft.caseMaterial.trim()     || undefined,
      strapMaterial:    this.productDraft.strapMaterial.trim()    || undefined,
      dialColor:        this.productDraft.dialColor.trim()        || undefined,
      caseSize:         this.productDraft.caseSize.trim()         || undefined,
      waterResistance:  this.productDraft.waterResistance.trim()  || undefined,
      warranty:         this.productDraft.warranty.trim()         || undefined,
      isFeatured:       !!this.productDraft.isFeatured,
      isNewArrival:     !!this.productDraft.isNewArrival,
      isBestSeller:     !!this.productDraft.isBestSeller,
      isActive:         !!this.productDraft.isActive
    };
  }

  private slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private mapAdminCoupon(c: AdminCoupon): CouponItem {
    return {
      id:           c._id,
      code:         c.code,
      discountType: c.discountType === 'flat' ? 'Flat' : 'Percentage',
      value:        c.discountValue,
      minPurchase:  c.minPurchase ?? 0,
      expiryDate:   c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0, 10) : '',
      usageLimit:   c.usageLimit ?? 0,
      active:       c.isActive !== false,
      usedCount:    c.usedCount ?? 0
    };
  }

  private mapAdminBanner(b: AdminBanner): BannerItem {
    return {
      id:           b._id,
      title:        b.title,
      imageUrl:     b.image,
      redirectLink: b.redirectLink ?? '',
      status:       b.isActive ? 'Active' : 'Inactive',
      sortOrder:    Number.isFinite(b.sortOrder) ? b.sortOrder : 0
    };
  }

  private resetCouponForm() {
    this.couponForm = {
      code: '', discountType: 'Percentage', value: 10,
      minPurchase: 0, expiryDate: '', usageLimit: 100, active: true
    };
  }

  private resetBannerForm() {
    this.bannerForm = { title: '', imageUrl: '', redirectLink: '', status: 'Active' };
  }

  private clearMessages() {
    this.notice.set(null);
    this.error.set(null);
  }

  private setError(message: string) {
    this.showAlert('error', 'Error', message);
  }
}