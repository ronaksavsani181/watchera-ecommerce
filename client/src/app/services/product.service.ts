import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, map, tap, throwError } from 'rxjs';

export interface Review {
  user: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Product {
  _id: string;
  id: string;
  name: string;
  slug: string;
  brand: string;
  collection: string;
  category: string;
  gender: string;
  price: number;
  description: string;
  image: string;
  gallery: string[];
  video?: string;
  specs: {
    case: string;
    movement: string;
    dial: string;
    strap: string;
    size: string;
    waterResistance: string;
    warranty: string;
  };
  features: string[];
  isNewArrival: boolean;
  isBestSeller: boolean;
  inStock: boolean;
  reviews: Review[];
}

interface BackendReview {
  name?: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface BackendProduct {
  _id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  category: string;
  gender: string;
  price: number;
  stock: number;
  images?: string[];
  video?: string;
  movement?: string;
  caseMaterial?: string;
  strapMaterial?: string;
  dialColor?: string;
  caseSize?: string;
  waterResistance?: string;
  warranty?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  reviews?: BackendReview[];
}

interface ProductListResponse {
  success: boolean;
  products: BackendProduct[];
}

interface ProductResponse {
  success: boolean;
  product: BackendProduct;
}

interface ReviewResponse {
  success: boolean;
  message: string;
}

const collectionFromCategory = (category: string) => {
  const key = (category || '').toLowerCase();

  if (key === 'luxury') return 'Mariner';
  if (key === 'sport') return 'Velocity';
  if (key === 'casual') return 'Celestial';
  if (key === 'smart') return 'Pulse';

  return category || 'Standard';
};

export const mapBackendProduct = (raw: BackendProduct): Product => {
  const gallery = raw.images && raw.images.length > 0 ? raw.images : [];
  const fallbackImage = 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1200';
  const image = gallery[0] || fallbackImage;

  const reviews = (raw.reviews || []).map((entry) => ({
    user: entry.name || 'Verified Buyer',
    rating: entry.rating || 5,
    comment: entry.comment || '',
    date: entry.createdAt
      ? new Date(entry.createdAt).toLocaleDateString('en-IN')
      : new Date().toLocaleDateString('en-IN')
  }));

  const features = [
    raw.movement ? `${raw.movement} movement` : null,
    raw.caseMaterial ? `${raw.caseMaterial} case` : null,
    raw.strapMaterial ? `${raw.strapMaterial} strap` : null,
    raw.waterResistance ? `Water resistance ${raw.waterResistance}` : null,
    raw.warranty ? `${raw.warranty} warranty` : null
  ].filter((entry): entry is string => !!entry);

  return {
    _id: raw._id,
    id: raw._id,
    slug: raw.slug || raw._id,
    name: raw.name || 'Unknown Timepiece',
    brand: raw.brand || 'Watchera',
    collection: collectionFromCategory(raw.category),
    category: raw.category || 'Luxury',
    gender: raw.gender || 'Unisex',
    price: raw.price || 0,
    description: raw.description || raw.shortDescription || '',
    image,
    gallery: gallery.length > 0 ? gallery : [image],
    video: typeof raw.video === 'string' && raw.video.trim() ? raw.video.trim() : undefined,
    specs: {
      case: raw.caseMaterial || 'Premium Alloy',
      movement: raw.movement || 'Automatic',
      dial: raw.dialColor || 'Matte Black',
      strap: raw.strapMaterial || 'Leather',
      size: raw.caseSize || '40mm',
      waterResistance: raw.waterResistance || '50m',
      warranty: raw.warranty || '2 Years'
    },
    features,
    isNewArrival: !!raw.isNewArrival,
    isBestSeller: !!raw.isBestSeller,
    inStock: (raw.stock || 0) > 0,
    reviews
  };
};

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/products`;

  products = signal<Product[]>([]);

  constructor() {
    this.loadAll();
  }

  loadAll(limit = 120) {
    this.http
      .get<ProductListResponse>(`${this.api}?page=1&limit=${limit}`)
      .pipe(map((response) => (response?.products || []).map(mapBackendProduct)))
      .subscribe({
        next: (data) => this.products.set(data),
        error: (error) => {
          console.error('Failed to load products', error);
          this.products.set([]);
        }
      });
  }

  getById(id: string) {
    return this.http.get<ProductResponse>(`${this.api}/${id}`).pipe(
      map((response) => mapBackendProduct(response.product)),
      catchError(this.handleError)
    );
  }

  addReview(productId: string, review: Pick<Review, 'rating' | 'comment'>) {
    return this.http.post<ReviewResponse>(`${this.api}/${productId}/review`, review).pipe(
      tap(() => this.loadAll()),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    const message = error.error?.message || error.message || 'An unknown API error occurred';
    return throwError(() => new Error(message));
  }
}