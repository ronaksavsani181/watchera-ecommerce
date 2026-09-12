import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

export type AdminRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface SalesPoint {
  label: string;
  value: number;
}

export interface DashboardSummary {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
  salesToday: number;
  salesWeekly: number;
  salesMonthly: number;
  salesYearly: number;
}

export interface AdminDashboard {
  success: boolean;
  summary: DashboardSummary;
  salesSeries: SalesPoint[];
  topSelling: TopSelling[];
  recentOrders: AdminOrder[];
  recentCustomers: AdminUser[];
}

export interface TopSelling {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  revenue: number;
}

export interface AdminProduct {
  _id: string;
  name: string;
  brand: string;
  modelNumber?: string;
  slug: string;
  sku: string;
  category: 'Luxury' | 'Sport' | 'Casual' | 'Smart';
  gender: 'Men' | 'Women' | 'Unisex';
  subcategory?: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice: number;
  stock: number;
  images: string[];
  video?: string;
  movement?: string;
  caseMaterial?: string;
  strapMaterial?: string;
  dialColor?: string;
  caseSize?: string;
  waterResistance?: string;
  warranty?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AdminProductPayload {
  name: string;
  brand: string;
  modelNumber?: string;
  slug?: string;
  sku?: string;
  category: 'Luxury' | 'Sport' | 'Casual' | 'Smart';
  gender: 'Men' | 'Women' | 'Unisex';
  subcategory?: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice: number;
  stock: number;
  images: string[];
  video?: string;
  movement?: string;
  caseMaterial?: string;
  strapMaterial?: string;
  dialColor?: string;
  caseSize?: string;
  waterResistance?: string;
  warranty?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
}

export interface AdminProductsResponse {
  success: boolean;
  products: AdminProduct[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  success: boolean;
  count: number;
  users: AdminUser[];
}

export interface AdminOrder {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  totalPrice: number;
  orderStatus: string;
  paymentMethod: string;
  isPaid: boolean;
  createdAt: string;
  itemCount: number;
}

export interface AdminOrdersResponse {
  success: boolean;
  orders: AdminOrder[];
  total: number;
  page: number;
  pages: number;
}

export interface AdminReportSummary {
  totalRevenue: number;
  totalOrders: number;
  unitsSold: number;
  averageOrderValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
}

export interface AdminReportsResponse {
  success: boolean;
  summary: AdminReportSummary;
  statusBreakdown: StatusBreakdownItem[];
  salesSeries: SalesPoint[];
  topSelling: TopSelling[];
  orders: AdminOrder[];
}

export interface AdminCoupon {
  _id: string;
  code: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  minPurchase: number;
  expiryDate?: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminCouponsResponse {
  success: boolean;
  coupons: AdminCoupon[];
}

export interface AdminBanner {
  _id: string;
  title: string;
  image: string;
  redirectLink: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminBannersResponse {
  success: boolean;
  banners: AdminBanner[];
}

// --- NEW INTERFACES FOR REAL SHIPPING DATA ---
export interface ShippingZone {
  _id: string;
  region: string;
  cost: number;
  eta: string;
  createdAt: string;
}

export interface ShippingZonesResponse {
  success: boolean;
  zones: ShippingZone[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/admin`;

  // --- DASHBOARD & REPORTS ---
  getDashboard(range: AdminRange = 'month', from = '', to = '') {
    let params = new HttpParams().set('range', range);
    if (range === 'custom' && from && to) {
      params = params.set('from', from).set('to', to);
    }
    return this.http.get<AdminDashboard>(`${this.api}/dashboard`, { params });
  }

  getReports(range: AdminRange = 'month', from = '', to = '') {
    let params = new HttpParams().set('range', range);
    if (range === 'custom' && from && to) {
      params = params.set('from', from).set('to', to);
    }
    return this.http.get<AdminReportsResponse>(`${this.api}/reports`, { params });
  }

  // --- PRODUCTS ---
  getProducts(page = 1, limit = 200) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<AdminProductsResponse>(`${this.api}/products`, { params });
  }

  createProduct(payload: AdminProductPayload) {
    return this.http.post<{ success: boolean; message: string; product: AdminProduct }>(
      `${this.api}/products`, payload
    );
  }

  updateProduct(id: string, payload: Partial<AdminProductPayload>) {
    return this.http.put<{ success: boolean; message: string; product: AdminProduct }>(
      `${this.api}/products/${id}`, payload
    );
  }

  deleteProduct(id: string) {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/products/${id}`);
  }

  // --- USERS ---
  getUsers() {
    return this.http.get<AdminUsersResponse>(`${this.api}/users`);
  }

  updateUserStatus(id: string, isActive: boolean) {
    return this.http.patch<{ success: boolean; message: string; user: AdminUser }>(
      `${this.api}/users/${id}/status`, { isActive }
    );
  }

  resetUserPassword(id: string, password: string) {
    return this.http.patch<{ success: boolean; message: string }>(
      `${this.api}/users/${id}/reset-password`, { password }
    );
  }

  deleteUser(id: string) {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/users/${id}`);
  }

  // --- ORDERS ---
  getOrders(page = 1, limit = 150) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<AdminOrdersResponse>(`${this.api}/orders`, { params });
  }

  updateOrderStatus(id: string, status: string) {
    return this.http.patch<{ success: boolean; message: string; order: AdminOrder }>(
      `${this.api}/orders/${id}/status`, { status }
    );
  }

  // --- COUPONS ---
  getCoupons() {
    return this.http.get<AdminCouponsResponse>(`${this.api}/coupons`);
  }

  createCoupon(payload: {
    code: string;
    discountType: 'Flat' | 'Percentage';
    value: number;
    minPurchase: number;
    expiryDate?: string;
    usageLimit: number;
    active: boolean;
  }) {
    return this.http.post<{ success: boolean; message: string; coupon: AdminCoupon }>(
      `${this.api}/coupons`, payload
    );
  }

  toggleCouponStatus(id: string, isActive: boolean) {
    return this.http.patch<{ success: boolean; message: string; coupon: AdminCoupon }>(
      `${this.api}/coupons/${id}/status`, { isActive }
    );
  }

  deleteCoupon(id: string) {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/coupons/${id}`);
  }

  // --- BANNERS ---
  getBanners() {
    return this.http.get<AdminBannersResponse>(`${this.api}/banners`);
  }

  createBanner(payload: {
    title: string;
    imageUrl: string;
    redirectLink?: string;
    status: 'Active' | 'Inactive';
    sortOrder?: number;
  }) {
    return this.http.post<{ success: boolean; message: string; banner: AdminBanner }>(
      `${this.api}/banners`, payload
    );
  }

  toggleBannerStatus(id: string, isActive: boolean) {
    return this.http.patch<{ success: boolean; message: string; banner: AdminBanner }>(
      `${this.api}/banners/${id}/status`, { isActive }
    );
  }

  deleteBanner(id: string) {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/banners/${id}`);
  }

  // --- REAL SHIPPING ZONES ---
  getShippingZones() {
    return this.http.get<ShippingZonesResponse>(`${this.api}/shipping-zones`);
  }

  createShippingZone(payload: { region: string; cost: number; eta: string }) {
    return this.http.post<{ success: boolean; message: string; zone: ShippingZone }>(
      `${this.api}/shipping-zones`, payload
    );
  }

  deleteShippingZone(id: string) {
    return this.http.delete<{ success: boolean; message: string }>(`${this.api}/shipping-zones/${id}`);
  }
}