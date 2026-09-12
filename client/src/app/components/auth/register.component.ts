import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { NavbarComponent } from '../layout/navbar/navbar';
import { FooterComponent } from '../layout/footer/footer';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NavbarComponent,
    FooterComponent
  ],
  template: `
  
  <app-navbar></app-navbar>

  <div class="min-h-screen bg-black lg:grid lg:grid-cols-2">

    <div class="hidden lg:block relative">
      <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10"></div>
      <img
        src="https://i.pinimg.com/736x/c5/7c/29/c57c29e40e37b5abbbd420228ec8461e.jpg?q=80&w=1800&auto=format&fit=crop"
        class="absolute inset-0 h-full w-full object-cover"
        alt="Luxury Watch Collection"
      />
      <div class="absolute bottom-16 left-12 z-20">
        <h2 class="font-serif text-3xl text-white tracking-wide">Timeless Elegance.</h2>
        <p class="text-gray-400 text-sm mt-2 uppercase tracking-[0.2em]">Curated for the extraordinary</p>
      </div>
    </div>

    <div class="flex items-center justify-center px-6 py-16 lg:py-24 z-10 bg-[#050505]">

      <div class="w-full max-w-md">

        <h1 class="text-4xl font-serif text-white">
          Create Account
        </h1>

        <p class="mt-2 text-gray-400 text-sm">
          Join Watchera and start exploring curated luxury timepieces.
        </p>

        @if (errorMessage()) {
          <p class="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            {{ errorMessage() }}
          </p>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 space-y-5">

          <input
            type="text"
            formControlName="name"
            placeholder="Full Name"
            class="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition-colors"
          />

          <input
            type="email"
            formControlName="email"
            placeholder="Email Address"
            class="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition-colors"
          />

          <input
            type="password"
            formControlName="password"
            placeholder="Password (Min 6 characters)"
            class="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition-colors"
          />

          <input
            type="password"
            formControlName="confirmPassword"
            placeholder="Confirm Password"
            class="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition-colors"
          />

          <button
            type="submit"
            [disabled]="isLoading() || form.invalid"
            class="w-full bg-[#D4AF37] hover:bg-white py-3.5 mt-4 rounded-lg text-black text-sm uppercase tracking-[0.15em] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
          >
            {{ isLoading() ? 'Creating Account...' : 'Create Account' }}
          </button>

        </form>

        <div class="flex justify-center mt-8 text-sm">
          <span class="text-gray-500 mr-2">Already registered?</span>
          <a
            routerLink="/login"
            [queryParams]="returnUrl() ? { returnUrl: returnUrl() } : null"
            class="text-[#D4AF37] hover:text-white transition-colors font-medium uppercase tracking-[0.1em]"
          >
            Sign In
          </a>
        </div>

      </div>

    </div>

  </div>

  <app-footer></app-footer>

  @if (showSuccessPopup()) {
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div class="bg-[#0a0a0a] border border-[#D4AF37]/20 shadow-2xl rounded-2xl p-10 text-center w-full max-w-md transform transition-all">
        <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8 text-[#D4AF37]">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 class="text-2xl font-serif text-white">
          Welcome to Watchera
        </h2>
        <p class="mt-3 text-gray-400 text-sm font-light leading-relaxed">
          Your account has been created successfully. Redirecting you to sign in...
        </p>
      </div>
    </div>
  }

  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnDestroy {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private redirectTimeout?: ReturnType<typeof setTimeout>;

  auth = inject(AuthService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showSuccessPopup = signal(false);

  returnUrl = signal<string | null>(this.readSafeReturnUrl());

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  submit() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (value.password !== value.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.registerForLoginRedirect({
      name: value.name || '',
      email: value.email || '',
      password: value.password || ''
    })
    .subscribe({

      next: () => {

        this.isLoading.set(false);
        this.showSuccessPopup.set(true);

        this.redirectTimeout = setTimeout(() => {

          const returnUrl = this.readSafeReturnUrl();

          this.router.navigate(['/login'], {
            queryParams: returnUrl ? { returnUrl } : undefined
          });

        }, 1800);

      },

      error: (error) => {

        this.errorMessage.set(error?.message || 'Unable to register');
        this.isLoading.set(false);

      }

    });

  }

  ngOnDestroy() {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
  }

  private readSafeReturnUrl(): string | null {

    const value = this.route.snapshot.queryParamMap.get('returnUrl') || '';

    if (!value.startsWith('/') || value.startsWith('//')) {
      return null;
    }

    return value;

  }

}