import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
  PLATFORM_ID,
  NgZone
} from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { Product, ProductService } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';

type DetailTab = 'specs' | 'reviews';
type MediaType = 'image' | 'video';

interface MediaItem {
  type: MediaType;
  src: string;
  preview: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnDestroy {
  isLightboxOpen: boolean = false;
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);
  private isBrowser = isPlatformBrowser(this.platformId);

  auth = inject(AuthService);
  cart = inject(CartService);
  orders = inject(OrderService);
  wishlist = inject(WishlistService);

  product = signal<Product | null>(null);
  activeMediaIndex = signal(0);
  activeTab = signal<DetailTab>('specs');
  reviewRating = signal(5);
  reviewComment = '';
  isSubmittingReview = signal(false);
  reviewError = signal<string | null>(null);
  
  // Explicitly set type to number for the window.setInterval
  private rotationHandle: number | null = null;

  relatedProducts = computed(() => {
    const current = this.product();
    if (!current) return [];

    return this.productService
      .products()
      .filter((entry) => entry._id !== current._id && entry.collection === current.collection)
      .slice(0, 4);
  });

  mediaItems = computed<MediaItem[]>(() => {
    const current = this.product();
    if (!current) return [];

    const gallery = [current.image, ...(current.gallery || [])].filter((image) => !!image);
    const uniqueImages = [...new Set(gallery)];

    const items: MediaItem[] = uniqueImages.map((image) => ({
      type: 'image',
      src: image,
      preview: image
    }));

    if (current.video) {
      items.push({
        type: 'video',
        src: current.video,
        preview: uniqueImages[0] || current.image
      });
    }

    return items;
  });

  activeMedia = computed<MediaItem | null>(() => {
    const items = this.mediaItems();
    if (items.length === 0) return null;

    const index = this.activeMediaIndex();
    if (index < 0 || index >= items.length) return items[0];
    return items[index];
  });

  averageRating = computed(() => {
    const reviews = this.product()?.reviews || [];
    if (reviews.length === 0) return 0;

    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((total / reviews.length) * 10) / 10;
  });

  canReview = computed(() => {
    const current = this.product();
    return !!(this.auth.isLoggedIn() && current && this.orders.hasUserPurchasedProduct(current._id));
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
  }

  private stopAutoRotate() {
    if (this.rotationHandle && this.isBrowser) {
      // Force window.clearInterval to satisfy the browser 'number' type
      window.clearInterval(this.rotationHandle);
      this.rotationHandle = null;
    }
  }

  private startAutoRotate() {
    this.stopAutoRotate();

    if (!this.isBrowser || this.mediaItems().length <= 1) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      // Force window.setInterval to explicitly return a 'number'
      this.rotationHandle = window.setInterval(() => {
        const total = this.mediaItems().length;
        if (total <= 1) return;

        this.ngZone.run(() => {
          this.activeMediaIndex.update((index) => (index + 1) % total);
        });
      }, 30000);
    });
  }

  private loadProduct(id: string) {
    this.productService.getById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.activeMediaIndex.set(0);
        this.startAutoRotate();
        if (this.isBrowser) window.scrollTo(0, 0);
      },
      error: (error) => {
        console.error('Failed to load product', error);
        this.product.set(null);
        this.stopAutoRotate();
      }
    });
  }

  setActiveMedia(index: number) {
    this.activeMediaIndex.set(index);
    this.startAutoRotate();
  }

  addToCart(product: Product) {
    this.cart.addToCart(product._id, 1, product);
  }

  submitReview() {
    const current = this.product();

    if (!current || !this.reviewComment.trim()) return;

    this.isSubmittingReview.set(true);
    this.reviewError.set(null);

    this.productService
      .addReview(current._id, {
        rating: this.reviewRating(),
        comment: this.reviewComment.trim()
      })
      .subscribe({
        next: () => {
          this.reviewComment = '';
          this.reviewRating.set(5);
          this.activeTab.set('reviews');
          this.isSubmittingReview.set(false);
          this.loadProduct(current._id);
        },
        error: (error) => {
          const message = error?.message || 'Unable to submit review. Please try again.';
          this.reviewError.set(message);
          this.isSubmittingReview.set(false);
        }
      });
  }
}