import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-popup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    @if (auth.showAuthPopup()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 animate-fade-in">
        
        <div class="absolute inset-0 bg-black/80 backdrop-blur-md" (click)="auth.closePopup()"></div>

        <div class="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl flex flex-col md:flex-row animate-slide-up">
          
          <div class="hidden md:block md:w-1/2 relative bg-black">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0a]/90 z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1000&auto=format&fit=crop"
              class="absolute inset-0 h-full w-full object-cover opacity-80"
              alt="Luxury Timepiece"
            />
            <div class="absolute bottom-10 left-8 z-20 pr-8">
              <h2 class="font-serif text-2xl text-white tracking-wide">Exclusive Access.</h2>
              <p class="text-gray-400 text-xs mt-2 uppercase tracking-[0.15em] leading-relaxed">Sign in to save your curated wishlist and unlock faster checkout.</p>
            </div>
          </div>

          <div class="w-full md:w-1/2 p-8 lg:p-12 relative flex flex-col justify-center">
            
            <button
              type="button"
              (click)="auth.closePopup()"
              class="absolute right-6 top-6 text-gray-500 transition-all duration-300 hover:text-[#D4AF37] hover:rotate-90 focus:outline-none"
            >
              <span class="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 class="font-serif text-3xl text-white">Sign In</h3>
            <p class="mt-2 text-sm text-gray-400">Welcome back to Watchera.</p>

            @if (errorMessage()) {
              <div class="mt-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-5 w-5 text-red-400 shrink-0 mt-0.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="text-sm text-red-400 leading-relaxed">
                  {{ errorMessage() }}
                </p>
              </div>
            }

            <form [formGroup]="form" (ngSubmit)="submit()" class="mt-6 space-y-4">
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
              
              <div class="text-right pb-2">
                 <a routerLink="/forgot-password" (click)="auth.closePopup()" class="text-xs text-gray-500 hover:text-white transition-colors">
                  Forgot Password?
                </a>
              </div>

              <button 
                type="submit" 
                [disabled]="isLoading() || form.invalid" 
                class="w-full bg-[#D4AF37] hover:bg-white py-3.5 rounded-lg text-black text-xs uppercase tracking-[0.15em] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              >
                {{ isLoading() ? 'Authenticating...' : 'Sign In securely' }}
              </button>
            </form>

            <div class="mt-8 border-t border-white/5 pt-6 text-center text-sm text-gray-400">
              New to Watchera?
              <a routerLink="/register" (click)="auth.closePopup()" class="text-[#D4AF37] hover:text-white transition-colors font-medium ml-1 uppercase tracking-[0.05em]">
                Create account
              </a>
            </div>

          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthPopup {
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const credentials = this.form.getRawValue() as { email: string; password: string };
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.form.reset();
        // Automatically close the popup upon successful login
        this.auth.closePopup(); 
      },
      error: (error) => {
        this.errorMessage.set(error?.message || 'Unable to sign in. Please check your credentials.');
        this.isLoading.set(false);
      }
    });
  }
}