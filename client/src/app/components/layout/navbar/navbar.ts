import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { ProductService } from '../../../services/product.service';
import { WishlistService } from '../../../services/wishlist.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  private host = inject(ElementRef<HTMLElement>);
  private router = inject(Router);

  auth = inject(AuthService);
  cart = inject(CartService);
  wishlist = inject(WishlistService);
  products = inject(ProductService);

  mobileMenuOpen = signal(false);
  accountMenuOpen = signal(false);
  searchOpen = signal(false);
  isScrolled = signal(false);

  searchQuery = signal('');

  links = [
    { label: 'Men', path: '/collections/Men' },
    { label: 'Women', path: '/collections/Women' },
    { label: 'Collections', path: '/collections' },
    { label: 'Journal', path: '/journal' },
    { label: 'Concierge', path: '/concierge' }
  ];

  searchResults = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return [];
    }

    const toText = (value: unknown) => (typeof value === 'string' ? value.toLowerCase() : '');

    return this.products
      .products()
      .filter((product) => {
        const fields = [
          product.name,
          product.description,
          product.slug,
          product.collection,
          product.category,
          product.brand,
          product.specs?.case,
          product.specs?.movement,
          product.specs?.strap,
          product.specs?.dial
        ];

        return fields.some((value) => toText(value).includes(query));
      })
      .slice(0, 10);
  });

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 24);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeSearch();
    this.mobileMenuOpen.set(false);
    this.accountMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.accountMenuOpen.set(false);
    }
  }

  toggleMenu() {
    this.mobileMenuOpen.update((value) => !value);
    this.accountMenuOpen.set(false);
  }

  closeMenu() {
    this.mobileMenuOpen.set(false);
  }

  openSearch() {
    this.searchOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeSearch() {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    document.body.style.overflow = '';
  }

  quickSearch(term: string) {
    this.searchQuery.set(term);
  }

  toggleAccountMenu(event: Event) {
    event.stopPropagation();
    this.accountMenuOpen.update((value) => !value);
  }

  goToProduct(productId: string) {
    this.closeSearch();
    this.router.navigate(['/product', productId]);
  }

  signOut() {
    this.accountMenuOpen.set(false);
    this.mobileMenuOpen.set(false);
    this.auth.logout();
  }
}
