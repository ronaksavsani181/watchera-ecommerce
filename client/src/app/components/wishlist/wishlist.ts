import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../services/product.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink, CommonModule, CurrencyPipe],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistComponent {
  wishlist = inject(WishlistService);
  cart = inject(CartService);

  addToCart(product: Product) {
    this.cart.addToCart(product._id, 1, product);
  }
}