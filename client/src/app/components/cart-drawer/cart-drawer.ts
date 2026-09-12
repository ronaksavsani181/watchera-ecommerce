import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, CommonModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartDrawerComponent {
  cart = inject(CartService);
}