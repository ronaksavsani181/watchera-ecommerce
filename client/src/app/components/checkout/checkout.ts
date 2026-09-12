import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import {
  CheckoutPayload,
  CheckoutSummary,
  CheckoutSummaryItem,
  CouponValidationResult,
  Order,
  OrderService
} from '../../services/order.service';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  auth = inject(AuthService);
  cart = inject(CartService);
  orderService = inject(OrderService);

  isProcessing = signal(false);
  errorMessage = signal<string | null>(null);
  paymentNotice = signal<string | null>(null);
  isApplyingCoupon = signal(false);
  couponInput = signal('');
  couponError = signal<string | null>(null);
  couponNotice = signal<string | null>(null);
  appliedCoupon = signal<CouponValidationResult | null>(null);
  couponAppliedOnSubtotal = signal(0);
  checkoutSummary = signal<CheckoutSummary | null>(null);
  pendingPaymentOrder = signal<Order | null>(null);
  pendingOrderSubtotal = signal(0);
  pendingCouponCode = signal('');
  private razorpayLoaderPromise: Promise<boolean> | null = null;

  checkoutItems = computed<CheckoutSummaryItem[]>(() => {
    const summary = this.checkoutSummary();
    if (summary?.items?.length) {
      return summary.items;
    }

    return this.cart.items().map((item) => ({
      productId: item.product._id,
      name: item.product.name,
      image: item.product.image,
      price: item.product.price,
      quantity: item.quantity,
      lineTotal: item.product.price * item.quantity
    }));
  });

  subtotal = computed(() => this.checkoutSummary()?.itemsPrice ?? this.cart.subtotal());
  couponDiscount = computed(
    () => this.checkoutSummary()?.couponDiscount ?? this.appliedCoupon()?.discount ?? 0
  );
  payableTotal = computed(
    () => this.checkoutSummary()?.totalPrice ?? Math.max(0, this.subtotal() - this.couponDiscount())
  );

  // Industry Standard: Strictly typed, non-nullable form
  checkoutForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', [Validators.required, Validators.minLength(4)]],
    country: ['India', Validators.required]
  });

  constructor() {
    effect(() => {
      const isLoggedIn = this.auth.isLoggedIn();
      const cartCount = this.cart.count();
      const activeCouponCode = (this.appliedCoupon()?.code || '').trim().toUpperCase();

      if (!isLoggedIn) {
        this.checkoutSummary.set(null);
        return;
      }

      // Dependency for re-sync when cart changes.
      void cartCount;
      this.syncCheckoutSummary(activeCouponCode);
    });

    effect(() => {
      const applied = this.appliedCoupon();
      const subtotal = this.subtotal();
      const appliedOnSubtotal = this.couponAppliedOnSubtotal();

      if (applied && appliedOnSubtotal > 0 && subtotal !== appliedOnSubtotal) {
        this.appliedCoupon.set(null);
        this.couponAppliedOnSubtotal.set(0);
        this.couponNotice.set('Cart updated. Please apply coupon again for accurate discount.');
      }
    });

    effect(() => {
      const pendingOrder = this.pendingPaymentOrder();
      if (!pendingOrder) {
        return;
      }

      const subtotal = this.subtotal();
      const activeCouponCode = (this.appliedCoupon()?.code || '').trim().toUpperCase();

      if (
        this.pendingOrderSubtotal() !== subtotal ||
        this.pendingCouponCode() !== activeCouponCode
      ) {
        this.pendingPaymentOrder.set(null);
        this.pendingOrderSubtotal.set(0);
        this.pendingCouponCode.set('');
      }
    });
  }

  redirectToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/checkout' }
    });
  }

  private syncCheckoutSummary(couponCode = '', showError = false) {
    if (!this.auth.isLoggedIn()) {
      this.checkoutSummary.set(null);
      return;
    }

    this.orderService.getCheckoutSummary(couponCode).subscribe({
      next: (summary) => {
        this.checkoutSummary.set(summary);
      },
      error: (error) => {
        if (!showError) {
          return;
        }
        const message = error?.message || 'Unable to refresh checkout details.';
        this.errorMessage.set(message);
      }
    });
  }

  applyCoupon() {
    const code = this.couponInput().trim().toUpperCase();
    if (!code) {
      this.couponError.set('Please enter a coupon code.');
      this.couponNotice.set(null);
      return;
    }

    if (!this.auth.isLoggedIn()) {
      this.couponError.set('Please sign in to apply coupon.');
      this.couponNotice.set(null);
      this.redirectToLogin();
      return;
    }

    if (this.checkoutItems().length === 0) {
      this.couponError.set('Add products to cart before applying coupon.');
      this.couponNotice.set(null);
      return;
    }

    this.isApplyingCoupon.set(true);
    this.couponError.set(null);
    this.couponNotice.set(null);

    const itemsPrice = this.subtotal();

    this.orderService.validateCoupon(code, itemsPrice).subscribe({
      next: (response) => {
        this.appliedCoupon.set(response.coupon);
        this.couponAppliedOnSubtotal.set(itemsPrice);
        this.couponInput.set(response.coupon.code);
        this.couponNotice.set(`Coupon ${response.coupon.code} applied successfully.`);
        this.syncCheckoutSummary(response.coupon.code, true);
        this.isApplyingCoupon.set(false);
      },
      error: (error) => {
        const message = error?.message || 'Invalid coupon code.';
        this.appliedCoupon.set(null);
        this.couponAppliedOnSubtotal.set(0);
        this.couponError.set(message);
        this.syncCheckoutSummary('', false);
        this.isApplyingCoupon.set(false);
      }
    });
  }

  removeCoupon() {
    this.appliedCoupon.set(null);
    this.couponAppliedOnSubtotal.set(0);
    this.couponError.set(null);
    this.couponNotice.set('Coupon removed.');
    this.syncCheckoutSummary('', false);
  }

  private loadRazorpayScript(): Promise<boolean> {
    // SSR Protection: Do not attempt to load script on the server
    if (!this.isBrowser) {
      return Promise.resolve(false);
    }

    if (window.Razorpay) {
      return Promise.resolve(true);
    }

    if (this.razorpayLoaderPromise) {
      return this.razorpayLoaderPromise;
    }

    this.razorpayLoaderPromise = new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

    return this.razorpayLoaderPromise;
  }

  private startRazorpayPayment(order: Order) {
    this.orderService.createRazorpayOrder(order.id).subscribe({
      next: async (gateway) => {
        this.paymentNotice.set(null);

        const scriptLoaded = await this.loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          this.errorMessage.set('Unable to load payment gateway. Please try again.');
          this.isProcessing.set(false);
          return;
        }

        const user = this.auth.currentUser();
        const billing = this.checkoutForm.getRawValue();

        const options = {
          key: gateway.key,
          amount: gateway.amount,
          currency: gateway.currency,
          name: 'Watchera',
          description: `Order #${order.id.slice(-6)}`,
          order_id: gateway.razorpayOrder.id,
          prefill: {
            name: billing.fullName || user?.name || '',
            email: user?.email || '',
            contact: billing.phone || ''
          },
          notes: {
            orderId: order.id
          },
          theme: {
            color: '#C6A76A'
          },
          modal: {
            ondismiss: () => {
              this.errorMessage.set(
                'Payment was cancelled. Your order is saved as pending. You can retry from checkout.'
              );
              this.isProcessing.set(false);
            }
          },
          handler: (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            this.orderService
              .verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order.id
              })
              .subscribe({
                next: () => {
                  this.cart.clear();
                  this.orderService.loadMyOrders();
                  this.appliedCoupon.set(null);
                  this.couponAppliedOnSubtotal.set(0);
                  this.pendingPaymentOrder.set(null);
                  this.pendingOrderSubtotal.set(0);
                  this.pendingCouponCode.set('');
                  this.errorMessage.set(null);
                  this.paymentNotice.set(null);
                  this.isProcessing.set(false);
                  this.router.navigate(['/orders']);
                },
                error: (error) => {
                  const message = error?.message || 'Payment verification failed. If amount was debited, contact support with your payment id.';
                  this.errorMessage.set(message);
                  this.isProcessing.set(false);
                }
              });
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', (event: any) => {
          const description = event?.error?.description || 'Payment failed. Please try again.';
          this.errorMessage.set(description);
          this.isProcessing.set(false);
        });
        razorpay.open();
      },
      error: (error) => {
        const message = error?.message || 'Unable to initialize payment gateway.';
        this.errorMessage.set(message);
        this.isProcessing.set(false);
      }
    });
  }

  onSubmit() {
    if (!this.auth.isLoggedIn()) {
      this.errorMessage.set('Please sign in to place your order. Your cart will be kept safe.');
      this.redirectToLogin();
      return;
    }

    if (this.checkoutForm.invalid || this.checkoutItems().length === 0) {
      this.checkoutForm.markAllAsTouched();
      if (this.checkoutForm.invalid) {
        this.errorMessage.set('Please complete all shipping details with valid phone and postal code.');
      }
      return;
    }

    this.isProcessing.set(true);
    this.errorMessage.set(null);
    this.paymentNotice.set(null);

    const payload = this.checkoutForm.getRawValue() as CheckoutPayload;
    const couponCode = (this.appliedCoupon()?.code || '').trim().toUpperCase();
    const pendingOrder = this.pendingPaymentOrder();

    this.orderService.getCheckoutSummary(couponCode).subscribe({
      next: (summary) => {
        this.checkoutSummary.set(summary);
        const subtotal = summary.itemsPrice;

        if (
          pendingOrder &&
          this.pendingOrderSubtotal() === subtotal &&
          this.pendingCouponCode() === couponCode
        ) {
          this.startRazorpayPayment(pendingOrder);
          return;
        }

        this.orderService
          .createOrder(payload, couponCode, 'Razorpay', false)
          .subscribe({
            next: (order) => {
              this.pendingPaymentOrder.set(order);
              this.pendingOrderSubtotal.set(subtotal);
              this.pendingCouponCode.set(couponCode);
              this.startRazorpayPayment(order);
            },
            error: (error) => {
              const message = error?.message || 'Unable to create order. Please try again.';
              this.errorMessage.set(message);
              this.isProcessing.set(false);
            }
          });
      },
      error: (error) => {
        const message = error?.message || 'Unable to refresh checkout totals.';
        this.errorMessage.set(message);
        this.isProcessing.set(false);
      }
    });
  }
}