import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { NavbarComponent } from '../layout/navbar/navbar';
import { FooterComponent } from '../layout/footer/footer';

@Component({
  selector: 'app-forgot-password',
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
          src="https://i.pinimg.com/736x/8b/ee/8a/8bee8a6178f6cfc099ea58f309fbb708.jpg?q=80&w=1800&auto=format&fit=crop"
          class="absolute inset-0 h-full w-full object-cover"
          alt="Luxury Watch Details"
        />
        <div class="absolute bottom-16 left-12 z-20">
          <h2 class="font-serif text-3xl text-white tracking-wide">A New Chapter.</h2>
          <p class="text-gray-400 text-sm mt-2 uppercase tracking-[0.2em]">Secure your Watchera account</p>
        </div>
      </div>

      <div class="flex items-center justify-center px-6 py-16 lg:py-24 z-10 bg-[#050505]">
        <div class="w-full max-w-md">
          
          <h1 class="text-4xl font-serif text-white">
            Reset Password
          </h1>
          <p class="mt-2 text-gray-400 text-sm">
            Enter your account email and set a new password directly.
          </p>

          @if (successMessage()) {
            <div class="mt-6 flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5 text-green-400 shrink-0 mt-0.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-sm text-green-400 leading-relaxed">
                {{ successMessage() }}
              </p>
            </div>
          }

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
              placeholder="New Password"
              class="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
            />
            
            <input
              type="password"
              formControlName="confirmPassword"
              placeholder="Confirm New Password"
              class="w-full px-4 py-3.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-colors"
            />
            
            <button 
              type="submit" 
              [disabled]="isSubmitting() || form.invalid" 
              class="w-full bg-[#D4AF37] hover:bg-white py-3.5 mt-4 rounded-lg text-black text-sm uppercase tracking-[0.15em] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              {{ isSubmitting() ? 'Updating Password...' : 'Update Password' }}
            </button>
            
          </form>

          <div class="flex justify-center mt-8 text-sm">
            <span class="text-gray-500 mr-2">Remember your password?</span>
            <a 
              routerLink="/login" 
              class="text-[#D4AF37] hover:text-white transition-colors font-medium uppercase tracking-[0.1em]"
            >
              Back to Sign In
            </a>
          </div>

        </div>
      </div>
    </div>

    <app-footer></app-footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  isSubmitting = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const email = value.email?.trim() || '';
    const password = value.password || '';
    const confirm = value.confirmPassword || '';

    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (password !== confirm) {
      this.errorMessage.set('New password and confirm password do not match.');
      return;
    }

    this.isSubmitting.set(true);
    this.auth.resetPassword({ email, password }).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Password updated successfully. You can now sign in.');
        this.form.reset();
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error?.message || 'Failed to reset password. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }
}