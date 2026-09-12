import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, concatMap, finalize, from, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { BackendProduct, Product, ProductService, mapBackendProduct } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface BackendCartItem {
  product: BackendProduct | string;
  quantity: number;
}

interface CartResponse {
  success: boolean;
  cart: {
    items: BackendCartItem[];
  };
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private products = inject(ProductService);
  private platformId = inject(PLATFORM_ID);
  
  private apiUrl = `${environment.apiUrl}/cart`;
  private storageKey = 'watchera_guest_cart_v1';
  private isBrowser = isPlatformBrowser(this.platformId);

  private _open = signal(false);
  private _items = signal<CartItem[]>([]);
  private mergingGuestCart = false;

  isOpen = computed(() => this._open());
  items = computed(() => this._items());
  count = computed(() => this._items().reduce((total, item) => total + item.quantity, 0));
  subtotal = computed(() =>
    this._items().reduce((total, item) => total + item.product.price * item.quantity, 0)
  );

  constructor() {
    this.loadGuestCartFromStorage();

    // Watch for Auth changes to merge guest cart or reload guest cart
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.mergeGuestCartIntoAccount();
      } else {
        this.loadGuestCartFromStorage();
      }
    });
  }

  // --- UI Controls ---

  openCart() {
    this._open.set(true);
  }

  closeCart() {
    this._open.set(false);
  }

  toggleCart() {
    this._open.update((value) => !value);
  }

  // --- Core State Updates ---

  // Centralized helper to update signal and instantly sync local storage for guests
  private syncCartState(newItems: CartItem[]) {
    this._items.set(newItems);
    if (!this.auth.isLoggedIn()) {
      this.saveGuestCartToStorage(newItems);
    }
  }

  private setCartFromResponse(response: CartResponse) {
    const newItems = this.mapCartItems(response.cart?.items || []);
    this.syncCartState(newItems);
  }

  // --- API & Actions ---

  loadCart(fallbackItems: CartItem[] = []) {
    this.http.get<CartResponse>(this.apiUrl).subscribe({
      next: (response) => {
        const serverItems = this.mapCartItems(response.cart?.items || []);
        this.syncCartState(this.appendMissingItems(serverItems, fallbackItems));
      },
      error: (error) => {
        console.error('Failed to load cart', error);
        this.syncCartState(fallbackItems.length > 0 ? fallbackItems : []);
      }
    });
  }

  addToCart(productId: string, quantity = 1, fallbackProduct?: Product) {
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    if (!this.auth.isLoggedIn()) {
      const product = this.findProductSnapshot(productId, fallbackProduct);

      if (product) {
        this.upsertGuestItem(product, safeQuantity);
        this.openCart();
        return;
      }

      this.products.getById(productId).subscribe({
        next: (resolvedProduct) => {
          this.upsertGuestItem(resolvedProduct, safeQuantity);
          this.openCart();
        },
        error: (error) => console.error('Failed to add guest cart item', error)
      });
      return;
    }

    this.openCart();
    this.http.post<CartResponse>(`${this.apiUrl}/add`, { productId, quantity: safeQuantity }).subscribe({
      next: (response) => this.setCartFromResponse(response),
      error: (error) => console.error('Failed to add product to cart', error)
    });
  }

  updateQuantity(productId: string, change: number) {
    const items = this._items();
    const current = items.find(
      (entry) => entry.product._id === productId || entry.product.id === productId
    );
    
    if (!current) return;

    // Force strict Number types to prevent string concatenation bugs ("1" + 1 = "11")
    const nextQuantity = Number(current.quantity) + Number(change);

    if (nextQuantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (!this.auth.isLoggedIn()) {
      const newItems = items.map((entry) =>
        entry.product._id === productId || entry.product.id === productId
          ? { ...entry, quantity: nextQuantity }
          : entry
      );
      this.syncCartState(newItems);
      return;
    }

    this.http
      .put<CartResponse>(`${this.apiUrl}/update`, {
        productId,
        quantity: nextQuantity
      })
      .subscribe({
        next: (response) => this.setCartFromResponse(response),
        error: (error) => console.error('Failed to update cart quantity', error)
      });
  }

  removeFromCart(productId: string) {
    if (!this.auth.isLoggedIn()) {
      const newItems = this._items().filter(
        (entry) => entry.product._id !== productId && entry.product.id !== productId
      );
      this.syncCartState(newItems);
      return;
    }

    // FIX: Using URL parameter instead of body. Many browsers/servers strip the body of DELETE requests.
    this.http
      .delete<CartResponse>(`${this.apiUrl}/remove/${productId}`)
      .subscribe({
        next: (response) => this.setCartFromResponse(response),
        error: (error) => console.error('Failed to remove cart item', error)
      });
  }

  clear() {
    this.syncCartState([]);
    this.clearGuestCartStorage();
  }

  // --- Internal Utilities & Storage ---

  private mapCartItems(items: BackendCartItem[] = []): CartItem[] {
    return items
      // FIX: Ensure entry exists AND entry.product is not null before mapping
      .filter((entry) => entry && entry.product && typeof entry.product !== 'string')
      .map((entry) => ({
        product: mapBackendProduct(entry.product as BackendProduct),
        quantity: Number(entry.quantity)
      }));
  }

  private saveGuestCartToStorage(items: CartItem[]) {
    if (!this.isBrowser) return;
    const sanitized = items.map((item) => ({
      product: item.product,
      quantity: Number(item.quantity)
    }));
    localStorage.setItem(this.storageKey, JSON.stringify(sanitized));
  }

  private readGuestCartFromStorage(): CartItem[] {
    if (!this.isBrowser) return [];
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((entry) => {
          const productId = entry?.product?._id || entry?.product?.id || '';
          const quantity = Number(entry?.quantity);

          if (!productId || !Number.isFinite(quantity) || quantity <= 0) return null;

          return {
            product: {
              ...(entry.product as Product),
              _id: productId,
              id: entry.product.id || productId
            },
            quantity: Math.max(1, quantity)
          } as CartItem;
        })
        .filter((entry): entry is CartItem => !!entry);
    } catch {
      console.warn('Corrupted guest cart storage detected. Clearing.');
      this.clearGuestCartStorage();
      return [];
    }
  }

  private clearGuestCartStorage() {
    if (this.isBrowser) {
      localStorage.removeItem(this.storageKey);
    }
  }

  private loadGuestCartFromStorage() {
    this._items.set(this.readGuestCartFromStorage());
  }

  private upsertGuestItem(product: Product, quantity: number) {
    const productId = product._id || product.id;
    if (!productId) return;

    const items = this._items();
    const existingIndex = items.findIndex(
      (entry) => entry.product._id === productId || entry.product.id === productId
    );

    let newItems: CartItem[];
    if (existingIndex === -1) {
      newItems = [...items, { product, quantity }];
    } else {
      newItems = items.map((entry, index) =>
        index === existingIndex 
          ? { ...entry, quantity: Number(entry.quantity) + quantity } 
          : entry
      );
    }
    
    this.syncCartState(newItems);
  }

  private appendMissingItems(baseItems: CartItem[], extraItems: CartItem[]) {
    if (extraItems.length === 0) return baseItems;
    const seen = new Set(baseItems.map((item) => item.product._id || item.product.id));
    const missing = extraItems.filter((item) => {
      const id = item.product._id || item.product.id;
      return !!id && !seen.has(id);
    });
    if (missing.length === 0) return baseItems;
    return [...baseItems, ...missing];
  }

  private findProductSnapshot(productId: string, fallback?: Product): Product | null {
    if (fallback) return fallback;
    return this.products.products().find((entry) => entry._id === productId || entry.id === productId) || null;
  }

  private mergeGuestCartIntoAccount() {
    if (this.mergingGuestCart) return;

    const guestItems = this.readGuestCartFromStorage();
    if (guestItems.length === 0) {
      this.loadCart();
      return;
    }

    this.mergingGuestCart = true;
    const failedProductIds = new Set<string>();

    from(guestItems)
      .pipe(
        concatMap((item) =>
          this.http
            .post<CartResponse>(`${this.apiUrl}/add`, {
              productId: item.product._id,
              quantity: item.quantity
            })
            .pipe(
              catchError((error) => {
                console.error('Failed to merge guest cart item', error);
                failedProductIds.add(item.product._id);
                return of(null);
              })
            )
        ),
        finalize(() => {
          const remaining = guestItems.filter((item) => failedProductIds.has(item.product._id));
          if (remaining.length > 0) {
            this.saveGuestCartToStorage(remaining);
          } else {
            this.clearGuestCartStorage();
          }
          this.loadCart(remaining);
          this.mergingGuestCart = false;
        })
      )
      .subscribe();
  }
}