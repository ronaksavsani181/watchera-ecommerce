import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, concatMap, finalize, from, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { BackendProduct, Product, ProductService, mapBackendProduct } from './product.service';

interface WishlistResponse {
  success: boolean;
  wishlist: {
    products: BackendProduct[];
  };
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private products = inject(ProductService);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = `${environment.apiUrl}/wishlist`;
  private storageKey = 'watchera_guest_wishlist_v1';
  private isBrowser = isPlatformBrowser(this.platformId);
  private mergingGuestWishlist = false;

  private _items = signal<Product[]>([]);

  items = computed(() => this._items());
  count = computed(() => this._items().length);

  constructor() {
    this.loadGuestWishlistFromStorage();

    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.mergeGuestWishlistIntoAccount();
      } else {
        this.loadGuestWishlistFromStorage();
      }
    });

    effect(() => {
      if (!this.auth.isLoggedIn()) {
        this.saveGuestWishlistToStorage(this._items());
      }
    });
  }

  private setWishlistFromResponse(response: WishlistResponse) {
    const products = (response.wishlist?.products || []).map(mapBackendProduct);
    this._items.set(products);
  }

  private readGuestWishlistFromStorage(): Product[] {
    if (!this.isBrowser) return [];

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as Product[];
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((entry) => {
          const productId = entry?._id || entry?.id || '';
          if (!productId) return null;

          return {
            ...(entry as Product),
            _id: productId,
            id: entry.id || productId
          } as Product;
        })
        .filter((entry): entry is Product => !!entry);
    } catch {
      console.warn('Corrupted guest wishlist storage detected. Clearing.');
      this.clearGuestWishlistStorage();
      return [];
    }
  }

  private saveGuestWishlistToStorage(items: Product[]) {
    if (!this.isBrowser) return;
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private clearGuestWishlistStorage() {
    if (this.isBrowser) {
      localStorage.removeItem(this.storageKey);
    }
  }

  private loadGuestWishlistFromStorage() {
    this._items.set(this.readGuestWishlistFromStorage());
  }

  private mergeGuestWishlistIntoAccount() {
    if (this.mergingGuestWishlist) return;

    const guestItems = this.readGuestWishlistFromStorage();
    if (guestItems.length === 0) {
      this.loadWishlist();
      return;
    }

    this.mergingGuestWishlist = true;
    const failedProductIds = new Set<string>();

    from(guestItems)
      .pipe(
        concatMap((product) =>
          this.http.post<WishlistResponse>(`${this.apiUrl}/add`, { productId: product._id }).pipe(
            catchError((error) => {
              console.error('Failed to merge guest wishlist item', error);
              failedProductIds.add(product._id);
              return of(null);
            })
          )
        ),
        finalize(() => {
          const remaining = guestItems.filter((product) => failedProductIds.has(product._id));
          if (remaining.length > 0) {
            this.saveGuestWishlistToStorage(remaining);
          } else {
            this.clearGuestWishlistStorage();
          }
          this.loadWishlist(remaining);
          this.mergingGuestWishlist = false;
        })
      )
      .subscribe();
  }

  private findProductSnapshot(productId: string): Product | null {
    const product = this.products
      .products()
      .find((entry) => entry._id === productId || entry.id === productId);
    return product || null;
  }

  private appendMissingProducts(baseItems: Product[], extraItems: Product[]) {
    if (extraItems.length === 0) return baseItems;

    const seen = new Set(baseItems.map((product) => product._id || product.id));
    const missing = extraItems.filter((product) => {
      const id = product._id || product.id;
      return !!id && !seen.has(id);
    });

    if (missing.length === 0) return baseItems;

    return [...baseItems, ...missing];
  }

  private addGuestWishlistItem(product: Product) {
    const productId = product._id || product.id;
    if (!productId || this.isInWishlist(productId)) return;

    this._items.update((items) => [product, ...items]);
  }

  loadWishlist(fallbackItems: Product[] = []) {
    this.http.get<WishlistResponse>(this.apiUrl).subscribe({
      next: (response) => {
        const serverItems = (response.wishlist?.products || []).map(mapBackendProduct);
        this._items.set(this.appendMissingProducts(serverItems, fallbackItems));
      },
      error: (error) => {
        console.error('Failed to load wishlist', error);
        this._items.set(fallbackItems.length > 0 ? fallbackItems : []);
      }
    });
  }

  isInWishlist(productId: string) {
    return this._items().some((product) => product._id === productId || product.id === productId);
  }

  toggleWishlist(product: Product | { _id?: string; id?: string }) {
    const id = product._id || product.id;
    if (!id) return;

    if (!this.auth.isLoggedIn()) {
      const candidate = product as Product;
      const fullProduct =
        candidate?._id && !!candidate?.name ? candidate : this.findProductSnapshot(id);

      if (this.isInWishlist(id)) {
        this._items.update((items) =>
          items.filter((entry) => entry._id !== id && entry.id !== id)
        );
        return;
      }

      if (fullProduct) {
        this.addGuestWishlistItem(fullProduct);
        return;
      }

      this.products.getById(id).subscribe({
        next: (resolvedProduct) => this.addGuestWishlistItem(resolvedProduct),
        error: (error) => console.error('Failed to add guest wishlist item', error)
      });
      return;
    }

    if (this.isInWishlist(id)) {
      this.remove(id);
    } else {
      this.add(id);
    }
  }

  add(productId: string) {
    this.http.post<WishlistResponse>(`${this.apiUrl}/add`, { productId }).subscribe({
      next: (response) => this.setWishlistFromResponse(response),
      error: (error) => console.error('Failed to add product to wishlist', error)
    });
  }

  remove(productId: string) {
    if (!this.auth.isLoggedIn()) {
      this._items.update((items) =>
        items.filter((product) => product._id !== productId && product.id !== productId)
      );
      return;
    }

    this.http
      .delete<WishlistResponse>(`${this.apiUrl}/remove`, {
        body: { productId }
      })
      .subscribe({
        next: (response) => this.setWishlistFromResponse(response),
        error: (error) => console.error('Failed to remove product from wishlist', error)
      });
  }
}