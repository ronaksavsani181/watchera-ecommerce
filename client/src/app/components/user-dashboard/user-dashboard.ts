import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { WishlistService } from '../../services/wishlist.service';

type DashboardTab = 'orders' | 'profile';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, DatePipe, CurrencyPipe],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDashboardComponent {
  private fb = inject(FormBuilder);

  auth = inject(AuthService);
  orders = inject(OrderService);
  wishlist = inject(WishlistService);

  activeTab = signal<DashboardTab>('orders');
  saveMessage = signal<string | null>(null);

  profileForm = this.fb.group({
    name: ['', Validators.required],
    email: [{ value: '', disabled: true }, Validators.required],
    phone: ['']
  });

  recentOrders = computed(() => this.orders.orders().slice(0, 3));
  totalOrders = computed(() => this.orders.orders().length);
  totalSpent = computed(() =>
    this.orders.orders().reduce((sum, order) => sum + order.total, 0)
  );
  lastOrderDate = computed(() => this.orders.orders()[0]?.date || null);

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email
      });
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saveMessage.set('Profile updates are enabled in backend profile APIs next step.');
  }
}
