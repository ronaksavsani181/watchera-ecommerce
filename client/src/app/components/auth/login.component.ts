import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { NavbarComponent } from '../layout/navbar/navbar';
import { FooterComponent } from '../layout/footer/footer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NavbarComponent,
    FooterComponent
  ],
  template: `
  
  <app-navbar></app-navbar>

  <div class="min-h-screen bg-[#050505] lg:grid lg:grid-cols-2">

    <div class="hidden lg:block relative">
      <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/60 z-10"></div>
      <img
        src="https://i.pinimg.com/736x/77/34/b1/7734b1e81c6bbe3ef18dfd84ccc8c254.jpg?q=80&w=1800&auto=format&fit=crop"
        class="absolute inset-0 h-full w-full object-cover"
        alt="Luxury Watch Close-up"
      />
      <div class="absolute bottom-16 left-12 z-20">
        <h2 class="font-serif text-3xl text-white tracking-wide">Welcome Back.</h2>
        <p class="text-gray-400 text-sm mt-2 uppercase tracking-[0.2em]">Resume your luxury journey</p>
      </div>
    </div>

    <div class="flex items-center justify-center px-6 py-16 lg:py-24 z-10 bg-[#050505]">

      <div class="w-full max-w-md">

        <h1 class="text-4xl font-serif text-white">Sign In</h1>

        <p class="mt-2 text-gray-400 text-sm">
          Access your orders, personalized wishlist, and exclusive offers.
        </p>

        @if (errorMessage()) {
          <div class="mt-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5 text-red-400 shrink-0 mt-0.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-sm text-red-400 leading-relaxed">
              {{ errorMessage() }}
            </p>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 space-y-5">

          <input
            type="email"
            formControlName="email"
            placeholder="Email Address"
            class="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
          />

          <input
            type="password"
            formControlName="password"
            placeholder="Password"
            class="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
          />

          <button
            type="submit"
            [disabled]="isLoading() || form.invalid"
            class="w-full bg-[#D4AF37] hover:bg-white py-3.5 mt-4 rounded-lg text-black text-sm uppercase tracking-[0.15em] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
          >
            {{ isLoading() ? 'Signing In...' : 'Sign In' }}
          </button>

        </form>

        <div class="flex flex-col sm:flex-row justify-between items-center mt-8 text-sm gap-4">
          <a routerLink="/forgot-password" class="text-gray-500 hover:text-white transition-colors">
            Forgot Password?
          </a>

          <a routerLink="/register" class="text-[#D4AF37] hover:text-white transition-colors font-medium uppercase tracking-[0.1em]">
            Create Account
          </a>
        </div>

      </div>

    </div>

  </div>

  <app-footer></app-footer>

  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  auth = inject(AuthService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  returnUrl = signal<string | null>(this.readSafeReturnUrl());

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = this.form.getRawValue() as {
      email: string;
      password: string;
    };

    this.auth.login(credentials).subscribe({

      next: () => {

        this.isLoading.set(false);

        const user = this.auth.currentUser();

        if (user?.role === 'admin') {
          this.router.navigate(['/admin']);
          return;
        }

        const returnUrl = this.readSafeReturnUrl();

        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        this.router.navigate(['/']);

      },

      error: (error) => {

        this.errorMessage.set(error?.message || 'Unable to sign in. Please check your credentials.');
        this.isLoading.set(false);

      }

    });

  }

  private readSafeReturnUrl(): string | null {

    const value = this.route.snapshot.queryParamMap.get('returnUrl') || '';

    if (!value.startsWith('/') || value.startsWith('//')) {
      return null;
    }

    return value;

  }

}