import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { CartService } from './cart.service';
import { BackendProduct, Product, mapBackendProduct } from './product.service';
import { catchError, map, tap, throwError } from 'rxjs';

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  _id: string;
  id: string;
  items: OrderItem[];
  totalAmount: number;
  total: number;
  couponCode?: string;
  couponDiscount?: number;
  isPaid?: boolean;
  status: string;
  paymentMethod: string;
  createdAt: string;
  date: string;
  shippingAddress: ShippingAddress;
}

interface BackendOrderItem {
  product: BackendProduct | string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface BackendOrder {
  _id: string;
  orderItems: BackendOrderItem[];
  totalPrice: number;
  couponCode?: string;
  couponDiscount?: number;
  isPaid?: boolean;
  orderStatus: string;
  paymentMethod?: string;
  createdAt: string;
  shippingAddress: ShippingAddress;
}

interface OrderListResponse {
  success: boolean;
  orders: BackendOrder[];
}

interface OrderResponse {
  success: boolean;
  order: BackendOrder;
}

export interface CouponValidationResult {
  code: string;
  discount: number;
  discountType: string;
  discountValue: number;
}

export interface CheckoutSummaryItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface CheckoutSummary {
  items: CheckoutSummaryItem[];
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  couponCode?: string;
  couponDiscount: number;
  totalPrice: number;
}

interface CouponValidationResponse {
  success: boolean;
  coupon: CouponValidationResult;
  totals: {
    itemsPrice: number;
    discount: number;
    total: number;
  };
}

interface CheckoutSummaryResponse {
  success: boolean;
  summary: CheckoutSummary;
}

interface RazorpayOrderResponse {
  success: boolean;
  key: string;
  orderId: string;
  amount: number;
  currency: string;
  orderAmount?: number;
  payableAmount?: number;
  isAmountCapped?: boolean;
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    receipt: string;
  };
}

interface RazorpayVerifyResponse {
  success: boolean;
  message: string;
}

export interface CheckoutPayload extends ShippingAddress {}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private api = `${environment.apiUrl}/orders`;

  private _orders = signal<Order[]>([]);
  orders = computed(() => this._orders());

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.loadMyOrders();
      } else {
        this._orders.set([]);
      }
    });
  }

  private toFallbackProduct(item: BackendOrderItem): Product {
    const id = typeof item.product === 'string' ? item.product : item.product._id;
    const name = item.name || 'Watchera Timepiece';
    const image = item.image || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1200';

    return {
      _id: id,
      id,
      slug: id,
      name,
      brand: 'Watchera',
      collection: 'Watchera',
      category: 'Unisex',
      gender: 'Unisex',
      price: item.price,
      description: '',
      image,
      gallery: [image],
      specs: {
        case: 'Premium Alloy',
        movement: 'Automatic',
        dial: 'Matte Black',
        strap: 'Leather',
        size: '40mm',
        waterResistance: '50m',
        warranty: '2 Years'
      },
      features: [],
      isNewArrival: false,
      isBestSeller: false,
      inStock: true,
      reviews: []
    };
  }

  private mapOrder(raw: BackendOrder): Order {
    const items = (raw.orderItems || []).map((item) => ({
      product:
        typeof item.product === 'string'
          ? this.toFallbackProduct(item)
          : mapBackendProduct(item.product),
      quantity: item.quantity,
      price: item.price
    }));

    return {
      _id: raw._id,
      id: raw._id,
      items,
      totalAmount: raw.totalPrice,
      total: raw.totalPrice,
      couponCode: raw.couponCode,
      couponDiscount: raw.couponDiscount || 0,
      isPaid: !!raw.isPaid,
      status: raw.orderStatus || 'Pending',
      paymentMethod: raw.paymentMethod || 'Card',
      createdAt: raw.createdAt,
      date: raw.createdAt,
      shippingAddress: raw.shippingAddress
    };
  }

  loadMyOrders() {
    this.http.get<OrderListResponse>(`${this.api}/my-orders`).subscribe({
      next: (response) => this._orders.set(response.orders.map((order) => this.mapOrder(order))),
      error: (error) => {
        console.error('Failed to load orders', error);
        this._orders.set([]);
      }
    });
  }

  validateCoupon(code: string, itemsPrice: number) {
    return this.http.post<CouponValidationResponse>(`${this.api}/validate-coupon`, {
      code,
      itemsPrice
    }).pipe(catchError(this.handleError));
  }

  getCheckoutSummary(couponCode = '') {
    return this.http
      .post<CheckoutSummaryResponse>(`${this.api}/checkout-summary`, {
        couponCode: couponCode.trim().toUpperCase() || undefined
      })
      .pipe(
        map((response) => response.summary),
        catchError(this.handleError)
      );
  }

  createOrder(
    shippingDetails: CheckoutPayload,
    couponCode = '',
    paymentMethod = 'Card',
    clearCartOnSuccess = true
  ) {
    return this.http
      .post<OrderResponse>(this.api, {
        shippingAddress: shippingDetails,
        paymentMethod,
        couponCode: couponCode.trim().toUpperCase() || undefined
      })
      .pipe(
        map((response) => this.mapOrder(response.order)),
        tap((order) => {
          this._orders.update((orders) => [order, ...orders]);
          if (clearCartOnSuccess) {
            this.cart.clear();
          }
        }),
        catchError(this.handleError)
      );
  }

  createRazorpayOrder(orderId: string) {
    return this.http.post<RazorpayOrderResponse>(`${this.api}/razorpay`, { orderId })
      .pipe(catchError(this.handleError));
  }

  verifyRazorpayPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderId: string;
  }) {
    return this.http.post<RazorpayVerifyResponse>(`${this.api}/verify-payment`, payload)
      .pipe(catchError(this.handleError));
  }

  hasUserPurchasedProduct(productId: string): boolean {
    return this._orders().some((order) =>
      order.items.some((item) => {
        const id = item.product._id || item.product.id;
        return id === productId;
      })
    );
  }

  private handleError(error: HttpErrorResponse) {
    const message = error.error?.message || error.message || 'An unknown order error occurred';
    return throwError(() => new Error(message));
  }
}