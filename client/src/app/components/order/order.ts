import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './order.html',
  styleUrl: './order.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent {
  orders = inject(OrderService);
}
