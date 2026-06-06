// employee-login.component.ts

import { Component, ChangeDetectorRef, ViewEncapsulation, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../Service/ApiService ';

@Component({
  selector: 'app-employee-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-login-component.html',
  styleUrls: ['./employee-login-component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EmployeeLoginComponent {

  email        = '';
  password     = '';
  loading      = false;
  showPassword = false;
  serverError  = '';
  errors: { email?: string; password?: string } = {};

  showReset        = false;
  resetEmail       = '';
  newPassword      = '';
  confirmPassword  = '';
  resetLoading     = false;
  resetSuccess     = false;
  showNewPwd       = false;
  showConfirmPwd   = false;
  resetServerError = '';
  resetErrors: { newPassword?: string; confirmPassword?: string } = {};

  constructor(
    private apiService: ApiService,
    private router:     Router,
    private cdr:        ChangeDetectorRef,
    private ngZone:     NgZone
  ) {}

  clearError(field: 'email' | 'password') {
    this.errors[field] = '';
    this.serverError   = '';
  }

  clearResetError(field: 'newPassword' | 'confirmPassword') {
    this.resetErrors[field] = '';
    this.resetServerError   = '';
  }

  onNewPasswordInput() {
    this.clearResetError('newPassword');
  }

  getEmailInitial(email: string): string {
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  goBackToLogin() {
    this.showReset        = false;
    this.newPassword      = '';
    this.confirmPassword  = '';
    this.resetErrors      = {};
    this.resetServerError = '';
    this.resetSuccess     = false;
    this.cdr.detectChanges();
  }

  get passwordStrength(): { percent: number; level: string; label: string } {
    const p = this.newPassword;
    let score = 0;
    if (p.length >= 8)           score++;
    if (/[A-Z]/.test(p))         score++;
    if (/[0-9]/.test(p))         score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map: Record<number, { percent: number; level: string; label: string }> = {
      0: { percent: 15,  level: 'weak',   label: 'Weak'   },
      1: { percent: 30,  level: 'weak',   label: 'Weak'   },
      2: { percent: 55,  level: 'fair',   label: 'Fair'   },
      3: { percent: 78,  level: 'good',   label: 'Good'   },
      4: { percent: 100, level: 'strong', label: 'Strong' },
    };
    return map[score];
  }

  private validateLogin(): boolean {
    this.errors = {};
    let valid = true;
    if (!this.email.trim()) {
      this.errors.email = 'Email is required.'; valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.errors.email = 'Enter a valid email address.'; valid = false;
    }
    if (!this.password) {
      this.errors.password = 'Password is required.'; valid = false;
    }
    return valid;
  }

  private validateReset(): boolean {
    this.resetErrors = {};
    let valid = true;
    if (!this.newPassword) {
      this.resetErrors.newPassword = 'New password is required.'; valid = false;
    } else if (this.newPassword.length < 8) {
      this.resetErrors.newPassword = 'Password must be at least 8 characters.'; valid = false;
    }
    if (!this.confirmPassword) {
      this.resetErrors.confirmPassword = 'Please confirm your password.'; valid = false;
    } else if (this.newPassword !== this.confirmPassword) {
      this.resetErrors.confirmPassword = 'Passwords do not match.'; valid = false;
    }
    return valid;
  }

  // ─────────────────────────────────────────────────────────────
  // KEY FIX: hardcoded paths must NOT set loading=true at all,
  // and must NOT be placed after loading=true is set.
  // The structure is:  validate → hardcoded check → set loading → HTTP call
  // ─────────────────────────────────────────────────────────────
  login(): void {
    this.serverError = '';
    this.errors      = {};

    // Step 1 — client-side validation (loading is still false here)
    if (!this.validateLogin()) {
      return;
    }

    const emailLower = this.email.trim().toLowerCase();
    const pwd        = this.password.trim();

    // Step 2 — hardcoded Admin (no HTTP call, no loading spinner needed)
    if (emailLower === 'admin@airecruiter.com' && pwd === 'Admin@123') {
      localStorage.setItem('employeeId',   'ADMIN001');
      localStorage.setItem('employeeName', 'Administrator');
      localStorage.setItem('department',   'Admin');
      this.router.navigate(['/dashboard']);
      return;                          // ← exits before loading is ever touched
    }

    // Step 3 — hardcoded HR (same pattern)
    if (emailLower === 'hr@airecruiter.com' && pwd === 'Hr@123') {
      localStorage.setItem('employeeId',   'HR001');
      localStorage.setItem('employeeName', 'HR User');
      localStorage.setItem('department',   'HR');
      this.router.navigate(['/dashboard']);
      return;                          // ← exits before loading is ever touched
    }

    // Step 4 — real API call: only NOW do we show the spinner
    this.loading = true;
    this.cdr.detectChanges();          // force spinner to render immediately

    this.apiService.employeeLogin({ email: this.email, password: this.password })
      .subscribe({
        next: (response: any) => {
          this.ngZone.run(() => {
            this.loading = false;
            console.log('Login response:', response);

            // First-login → show reset panel
            if (response?.firstLogin === true) {
              this.resetEmail = response.email || this.email;
              localStorage.setItem('resetEmail', this.resetEmail);
              this.showReset = true;
              this.cdr.detectChanges();
              return;
            }

            // Normal login
            localStorage.setItem('employeeId',   response.employeeId);
            localStorage.setItem('employeeName', response.employeeName);
            localStorage.setItem('department',   response.department);

            if (response.department === 'HR') {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/Employee-dashboard']);
            }
          });
        },

        error: (err: any) => {
          this.ngZone.run(() => {
            this.loading = false;

            // Defensive: backend might return 401/403 with firstLogin body
            if (err?.error?.firstLogin === true) {
              this.resetEmail = err.error.email || this.email;
              localStorage.setItem('resetEmail', this.resetEmail);
              this.showReset = true;
              this.cdr.detectChanges();
              return;
            }

            this.serverError = err?.error?.message || 'Invalid email or password';
            this.cdr.detectChanges();
            console.error('Login error:', err);
          });
        }
      });
  }

  // ── RESET PASSWORD ───────────────────────────────────────────
  resetPassword(): void {
    this.resetServerError = '';
    if (!this.validateReset()) return;

    this.resetLoading = true;
    this.cdr.detectChanges();

    this.apiService.resetPassword({
      email: this.resetEmail,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.resetLoading = false;
          this.resetSuccess = true;
          this.cdr.detectChanges();
          localStorage.removeItem('resetEmail');

          setTimeout(() => {
            this.ngZone.run(() => {
              this.showReset       = false;
              this.email           = this.resetEmail;
              this.password        = '';
              this.newPassword     = '';
              this.confirmPassword = '';
              this.resetEmail      = '';
              this.resetSuccess    = false;
              this.cdr.detectChanges();
            });
          }, 1500);
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.resetLoading     = false;
          this.resetServerError = err.error?.message || 'Reset failed. Please try again.';
          this.cdr.detectChanges();
        });
      }
    });
  }
}