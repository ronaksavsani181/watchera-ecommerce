import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { Product, ProductService } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name';
type PriceRange = 'under-50000' | '50000-100000' | '100000-200000' | 'above-200000';

interface PriceRangeOption {
  id: PriceRange;
  label: string;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  productService = inject(ProductService);
  cart = inject(CartService);
  wishlist = inject(WishlistService);

  activeCategory = signal<string | null>(null);
  mobileFiltersOpen = signal(false);

  // FILTER SIGNALS
  selectedBrands = signal<string[]>([]); // NEW: Brand filter signal
  selectedCollections = signal<string[]>([]);
  selectedMaterials = signal<string[]>([]);
  selectedMovements = signal<string[]>([]);
  selectedStraps = signal<string[]>([]);
  selectedDialColors = signal<string[]>([]);
  selectedPriceRanges = signal<PriceRange[]>([]);
  sortOption = signal<SortOption>('featured');

  allProducts = this.productService.products;

  priceRanges: PriceRangeOption[] = [
    { id: 'under-50000', label: 'Under ₹50,000' },
    { id: '50000-100000', label: '₹50,000 - ₹1,00,000' },
    { id: '100000-200000', label: '₹1,00,000 - ₹2,00,000' },
    { id: 'above-200000', label: 'Above ₹2,00,000' }
  ];

  // COMPUTED AVAILABLE FILTER OPTIONS
  availableBrands = computed(() =>
    [...new Set(this.allProducts().map((product) => product.brand))].sort()
  );

  availableCollections = computed(() =>
    [...new Set(this.allProducts().map((product) => product.collection))].sort()
  );

  availableMaterials = computed(() =>
    [...new Set(this.allProducts().map((product) => product.specs.case))].sort()
  );

  availableMovements = computed(() =>
    [...new Set(this.allProducts().map((product) => product.specs.movement))].sort()
  );

  availableStraps = computed(() =>
    [...new Set(this.allProducts().map((product) => product.specs.strap))].sort()
  );

  availableDialColors = computed(() =>
    [...new Set(this.allProducts().map((product) => product.specs.dial))].sort()
  );

  hasActiveFilters = computed(() => {
    return (
      this.selectedBrands().length > 0 ||
      this.selectedCollections().length > 0 ||
      this.selectedMaterials().length > 0 ||
      this.selectedMovements().length > 0 ||
      this.selectedStraps().length > 0 ||
      this.selectedDialColors().length > 0 ||
      this.selectedPriceRanges().length > 0
    );
  });

  filteredProducts = computed(() => {
    let products = [...this.allProducts()];
    const category = this.activeCategory();

    // 1. Category/Gender Filter
    if (category) {
      const normalized = category.toLowerCase();
      products = products.filter((product) => {
        const productCategory = product.category.toLowerCase();
        const productGender = product.gender.toLowerCase();
        if (normalized === 'kids') {
          return (
            productCategory === 'kids' || productCategory === 'unisex' ||
            productGender === 'kids' || productGender === 'unisex'
          );
        }
        if (normalized === 'men' || normalized === 'women' || normalized === 'unisex') {
          return productGender === normalized || productGender === 'unisex';
        }
        return productCategory === normalized;
      });
    }

    // 2. Apply Custom Filters
    const brandFilter = this.selectedBrands();
    if (brandFilter.length > 0) {
      products = products.filter((product) => brandFilter.includes(product.brand));
    }

    const collectionFilter = this.selectedCollections();
    if (collectionFilter.length > 0) {
      products = products.filter((product) => collectionFilter.includes(product.collection));
    }

    const materialFilter = this.selectedMaterials();
    if (materialFilter.length > 0) {
      products = products.filter((product) => materialFilter.includes(product.specs.case));
    }

    const movementFilter = this.selectedMovements();
    if (movementFilter.length > 0) {
      products = products.filter((product) => movementFilter.includes(product.specs.movement));
    }

    const strapFilter = this.selectedStraps();
    if (strapFilter.length > 0) {
      products = products.filter((product) => strapFilter.includes(product.specs.strap));
    }

    const dialFilter = this.selectedDialColors();
    if (dialFilter.length > 0) {
      products = products.filter((product) => dialFilter.includes(product.specs.dial));
    }

    const priceFilter = this.selectedPriceRanges();
    if (priceFilter.length > 0) {
      products = products.filter((product) =>
        priceFilter.some((range) => this.inPriceRange(product.price, range))
      );
    }

    // 3. Sorting
    const sort = this.sortOption();
    if (sort === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'name') {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    return products;
  });

  constructor() {
    // Listen to URL path changes (Categories)
    this.route.paramMap.subscribe((params) => {
      this.activeCategory.set(params.get('category'));
      this.mobileFiltersOpen.set(false);
    });

    // Listen to URL Query Parameters (specifically for the Brand redirect from Home)
    this.route.queryParamMap.subscribe((params) => {
      const brandParam = params.get('brand');
      if (brandParam) {
        // Only set it if it's not already in the array to prevent unnecessary trigger
        if (!this.selectedBrands().includes(brandParam)) {
          this.selectedBrands.set([brandParam]);
        }
      }
    });
  }

  // TOGGLE METHODS
  toggleBrand(value: string) {
    this.toggleSet(this.selectedBrands, value);
  }

  toggleCollection(value: string) {
    this.toggleSet(this.selectedCollections, value);
  }

  toggleMaterial(value: string) {
    this.toggleSet(this.selectedMaterials, value);
  }

  toggleMovement(value: string) {
    this.toggleSet(this.selectedMovements, value);
  }

  toggleStrap(value: string) {
    this.toggleSet(this.selectedStraps, value);
  }

  toggleDialColor(value: string) {
    this.toggleSet(this.selectedDialColors, value);
  }

  togglePriceRange(value: PriceRange) {
    this.selectedPriceRanges.update((list) => {
      if (list.includes(value)) {
        return list.filter((item) => item !== value);
      }
      return [...list, value];
    });
  }

  private toggleSet(target: ReturnType<typeof signal<string[]>>, value: string) {
    target.update((list) => {
      if (list.includes(value)) {
        return list.filter((item) => item !== value);
      }
      return [...list, value];
    });
  }

  private inPriceRange(price: number, range: PriceRange): boolean {
    if (range === 'under-50000') return price < 50000;
    if (range === '50000-100000') return price >= 50000 && price <= 100000;
    if (range === '100000-200000') return price > 100000 && price <= 200000;
    return price > 200000;
  }

  clearFilters() {
    this.selectedBrands.set([]);
    this.selectedCollections.set([]);
    this.selectedMaterials.set([]);
    this.selectedMovements.set([]);
    this.selectedStraps.set([]);
    this.selectedDialColors.set([]);
    this.selectedPriceRanges.set([]);
    this.sortOption.set('featured');

    // Clean the URL so the query param doesn't persist after clearing
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { brand: null },
      queryParamsHandling: 'merge'
    });
  }

  addToCart(product: Product, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.cart.addToCart(product._id, 1, product);
  }

  toggleWishlist(product: Product, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.wishlist.toggleWishlist(product);
  }
}