import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthPopup } from './components/auth/auth-popup.component';
// 👇 FIX: Added '.component' to the path to match standard Angular file naming
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer'; 
import { FooterComponent } from './components/layout/footer/footer'; // Also double-check this one
import { NavbarComponent } from './components/layout/navbar/navbar'; // And this one
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    CartDrawerComponent,
    FooterComponent,
    AuthPopup
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  showLayout = signal(true);

  ngOnInit() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects || event.url || '';
        const hideLayoutRoutes = ['/login', '/register', '/forgot-password', '/admin'];
        this.showLayout.set(!hideLayoutRoutes.some((route) => url.startsWith(route)));

        const user = this.auth.currentUser();
        const authPages = ['/login', '/register', '/forgot-password'];
        if (user?.role === 'admin' && !url.startsWith('/admin') && !authPages.some((route) => url.startsWith(route))) {
          this.router.navigate(['/admin']);
        }
      });
  }
}