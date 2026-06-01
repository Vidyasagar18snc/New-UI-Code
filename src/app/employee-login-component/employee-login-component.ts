// employee-login.component.ts

import { Component, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../Service/ApiService ';

@Component({
  selector: 'app-employee-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-login-component.html',
  styleUrl: './employee-login-component.css',

  // ─────────────────────────────────────────────────
  // KEY FIX: Disable View Encapsulation so component
  // CSS applies globally — prevents Angular from
  // scoping styles and blocking background/color rules
  // on the host element and child divs.
  // ─────────────────────────────────────────────────
  encapsulation: ViewEncapsulation.None
})
export class EmployeeLoginComponent {

  // ── Login form ──────────────────────────────
  email        = '';
  password     = '';
  loading      = false;
  showPassword = false;
  serverError  = '';
  errors: { email?: string; password?: string } = {};

  // ── Reset-password panel ────────────────────
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
    private cdr:        ChangeDetectorRef
  ) {}

  // ── Helpers ─────────────────────────────────
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

  // ── Password strength ────────────────────────
  get passwordStrength(): { percent: number; level: string; label: string } {
    const p = this.newPassword;
    let score = 0;
    if (p.length >= 8)            score++;
    if (/[A-Z]/.test(p))          score++;
    if (/[0-9]/.test(p))          score++;
    if (/[^A-Za-z0-9]/.test(p))  score++;

    const map: Record<number, { percent: number; level: string; label: string }> = {
      0: { percent: 15,  level: 'weak',   label: 'Weak'   },
      1: { percent: 30,  level: 'weak',   label: 'Weak'   },
      2: { percent: 55,  level: 'fair',   label: 'Fair'   },
      3: { percent: 78,  level: 'good',   label: 'Good'   },
      4: { percent: 100, level: 'strong', label: 'Strong' },
    };
    return map[score];
  }

  // ── Validate login ───────────────────────────
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

  // ── Validate reset ───────────────────────────
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

  // ── LOGIN ────────────────────────────────────
  login(): void {
    this.serverError = '';
    if (!this.validateLogin()) return;
    this.loading = true;

    this.apiService.employeeLogin({ email: this.email, password: this.password }).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.firstLogin) {
          this.resetEmail = response.email || this.email;
          localStorage.setItem('resetEmail', this.resetEmail);
          this.showReset = true;
          this.cdr.detectChanges();   // ← forces *ngIf to re-evaluate
        } else {
          localStorage.setItem('employeeId',   response.employeeId);
          localStorage.setItem('employeeName', response.employeeName);
          localStorage.setItem('department',   response.department);
          const route = (response.department === 'HR' || response.department === 'Admin')
            ? '/dashboard'
            : '/employee-dashboard';
          this.router.navigate([route]);
        }
      },
      error: (err) => {
        this.loading     = false;
        this.serverError = err.error?.message || 'Login failed. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── RESET PASSWORD ───────────────────────────
  resetPassword(): void {
    this.resetServerError = '';
    if (!this.validateReset()) return;
    this.resetLoading = true;

    this.apiService.resetPassword({ email: this.resetEmail, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.resetLoading = false;
        this.resetSuccess = true;
        this.cdr.detectChanges();
        localStorage.removeItem('resetEmail');

        setTimeout(() => {
          this.showReset       = false;
          this.email           = this.resetEmail;
          this.password        = '';
          this.newPassword     = '';
          this.confirmPassword = '';
          this.resetEmail      = '';
          this.resetSuccess    = false;
          this.cdr.detectChanges();   // ← switches back to login panel
        }, 1500);
      },
      error: (err) => {
        this.resetLoading     = false;
        this.resetServerError = err.error?.message || 'Reset failed. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}