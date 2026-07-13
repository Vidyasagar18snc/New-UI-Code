import { Component, ChangeDetectorRef, ViewEncapsulation, NgZone, OnInit } from '@angular/core';
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
export class EmployeeLoginComponent implements OnInit {

  isAnimating = true;

  // ── DARK / LIGHT MODE ────────────────────────────────────────
  isDarkMode = false;

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('themeMode', this.isDarkMode ? 'dark' : 'light');
    this.cdr.detectChanges();
  }

  ngOnInit() {
    // Restore saved theme preference
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      this.cdr.detectChanges();
    }

    // Parse URL hash for OAuth2 access token
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');

      if (accessToken) {
        this.loading = true;
        this.cdr.detectChanges();

        history.replaceState(null, '', window.location.pathname);

        fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`)
          .then(res => res.json())
          .then(userInfo => {
            this.handleSSOSuccess(userInfo.email || '', userInfo.name || 'Google Staff');
          })
          .catch(() => {
            this.handleSSOFailure('Failed to load user profile from Google.');
          });
      }
    }
  }

  private handleSSOSuccess(email: string, name: string) {
    this.ngZone.run(() => {
      this.loading = false;
      const emailLower = email?.trim().toLowerCase();

      if (emailLower === 'vidyasagar914863@gmail.com') {
        localStorage.setItem('employeeId', 'ADMIN001');
        localStorage.setItem('employeeName', 'Administrator');
        localStorage.setItem('department', 'Admin');
        this.router.navigate(['/dashboard']);
      } else if (emailLower === 'hr@airecruiter.com') {
        localStorage.setItem('employeeId', 'HR001');
        localStorage.setItem('employeeName', 'HR User');
        localStorage.setItem('department', 'HR');
        this.router.navigate(['/dashboard']);
      } else {
        localStorage.setItem('employeeId', 'EMP002');
        localStorage.setItem('employeeName', name || 'SSO User');
        localStorage.setItem('department', 'Engineering');
        this.router.navigate(['/Employee-dashboard']);
      }
    });
  }

  private handleSSOFailure(message: string) {
    this.ngZone.run(() => {
      this.loading = false;
      this.serverError = message;
      this.cdr.detectChanges();
    });
  }

  loginWithGoogle() {
    const clientId = '258953745111-m1sk1176v4e645buikeemjvd334g9g65.apps.googleusercontent.com';
    const redirectUri = window.location.origin + '/PortalLogin';
    const scope = 'openid email profile';
    const responseType = 'token';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}`;
    window.location.href = authUrl;
  }

  // ── LOGIN STATE ──────────────────────────────────────────────
  email = '';
  password = '';
  loading = false;
  showPassword = false;
  serverError = '';
  errors: { email?: string; password?: string } = {};

  // ── FIRST LOGIN RESET STATE ──────────────────────────────────
  showReset = false;
  resetEmail = '';
  newPassword = '';
  confirmPassword = '';
  resetLoading = false;
  resetSuccess = false;
  showNewPwd = false;
  showConfirmPwd = false;
  resetServerError = '';
  resetErrors: { newPassword?: string; confirmPassword?: string } = {};

  // ── FORGOT PASSWORD STATE ────────────────────────────────────
  showForgotPassword = false;
  otpSent = false;
  forgotEmail = '';
  forgotOtp = '';
  forgotNewPassword = '';
  forgotConfirmPassword = '';
  forgotLoading = false;
  forgotSuccess = false;
  forgotOtpLoading = false;
  showForgotNewPwd = false;
  showForgotConfirmPwd = false;
  forgotServerError = '';
  forgotErrors: {
    email?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  } = {};

  // ── CREATE ACCOUNT STATE (NEW) ───────────────────────────────
  showCreateAccount = false;
  signupUsername = '';
  signupEmail = '';
  signupPassword = '';
  signupConfirmPassword = '';
  signupDepartment = '';
  signupLoading = false;
  signupSuccess = false;
  showSignupPwd = false;
  showSignupConfirmPwd = false;
  signupServerError = '';
  signupErrors: {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    department?: string;
  } = {};

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  // ── SHARED HELPERS ───────────────────────────────────────────

  clearError(field: 'email' | 'password') {
    this.errors[field] = '';
    this.serverError = '';
  }

  clearResetError(field: 'newPassword' | 'confirmPassword') {
    this.resetErrors[field] = '';
    this.resetServerError = '';
  }

  onNewPasswordInput() {
    this.clearResetError('newPassword');
  }

  getEmailInitial(email: string): string {
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  goBackToLogin() {
    this.showReset = false;
    this.newPassword = '';
    this.confirmPassword = '';
    this.resetErrors = {};
    this.resetServerError = '';
    this.resetSuccess = false;
    this.cdr.detectChanges();
  }

  // ── PASSWORD STRENGTH GETTERS ────────────────────────────────

  get passwordStrength(): { percent: number; level: string; label: string } {
    const p = this.newPassword;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map: Record<number, { percent: number; level: string; label: string }> = {
      0: { percent: 15, level: 'weak', label: 'Weak' },
      1: { percent: 30, level: 'weak', label: 'Weak' },
      2: { percent: 55, level: 'fair', label: 'Fair' },
      3: { percent: 78, level: 'good', label: 'Good' },
      4: { percent: 100, level: 'strong', label: 'Strong' },
    };
    return map[score];
  }

  get forgotPasswordStrength(): { percent: number; level: string; label: string } {
    const p = this.forgotNewPassword;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map: Record<number, { percent: number; level: string; label: string }> = {
      0: { percent: 15, level: 'weak', label: 'Weak' },
      1: { percent: 30, level: 'weak', label: 'Weak' },
      2: { percent: 55, level: 'fair', label: 'Fair' },
      3: { percent: 78, level: 'good', label: 'Good' },
      4: { percent: 100, level: 'strong', label: 'Strong' },
    };
    return map[score];
  }

  get signupPasswordStrength(): { percent: number; level: string; label: string } {
    const p = this.signupPassword;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const map: Record<number, { percent: number; level: string; label: string }> = {
      0: { percent: 15, level: 'weak', label: 'Weak' },
      1: { percent: 30, level: 'weak', label: 'Weak' },
      2: { percent: 55, level: 'fair', label: 'Fair' },
      3: { percent: 78, level: 'good', label: 'Good' },
      4: { percent: 100, level: 'strong', label: 'Strong' },
    };
    return map[score];
  }

  // ── LOGIN VALIDATION ─────────────────────────────────────────

  private validateLogin(): boolean {
    this.errors = {};
    let valid = true;
    const rawEmail = this.email?.trim() ?? '';
    if (!rawEmail) {
      this.errors.email = 'Email is required.'; valid = false;
    } else if (rawEmail.startsWith('@')) {
      this.errors.email = "Email address cannot start with '@'."; valid = false;
    } else if (/^[^a-zA-Z0-9]/.test(rawEmail)) {
      this.errors.email = 'Email address cannot start with special characters.'; valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      this.errors.email = 'Enter a valid email address.'; valid = false;
    }
    if (!this.password) {
      this.errors.password = 'Password is required.'; valid = false;
    }
    return valid;
  }

  // ── LOGIN ────────────────────────────────────────────────────

  login(): void {
    this.serverError = '';
    this.errors = {};
    if (!this.validateLogin()) return;

    const emailLower = this.email.trim().toLowerCase();
    const pwd = this.password.trim();

    if (emailLower === 'vidyasagar914863@gmail.com' && pwd === 'Admin@123') {
      localStorage.setItem('employeeId', 'ADMIN001');
      localStorage.setItem('employeeName', 'Administrator');
      localStorage.setItem('department', 'Admin');
      this.router.navigate(['/dashboard']);
      return;
    }

    if (emailLower === 'hr@airecruiter.com' && pwd === 'Hr@123') {
      localStorage.setItem('employeeId', 'HR001');
      localStorage.setItem('employeeName', 'HR User');
      localStorage.setItem('department', 'HR');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.employeeLogin({ email: this.email, password: this.password }).subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          this.loading = false;
          if (response?.firstLogin === true) {
            this.resetEmail = response.email || this.email;
            localStorage.setItem('resetEmail', this.resetEmail);
            this.showReset = true;
            this.cdr.detectChanges();
            return;
          }
          localStorage.setItem('employeeId', response.employeeId);
          localStorage.setItem('employeeName', response.employeeName);
          localStorage.setItem('department', response.department);

          const department = response.department?.trim();

          if (department === 'HR' || department === 'Admin') {
            this.router.navigate(['/dashboard']);
          }
          else if (department === 'PANEL' || department === 'INTERVIEWER') {
            this.router.navigate(['/panel/interview-dashboard']);
          }
          else {
            this.router.navigate(['/Employee-dashboard']);
          }
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.loading = false;
          if (err?.error?.firstLogin === true) {
            this.resetEmail = err.error.email || this.email;
            localStorage.setItem('resetEmail', this.resetEmail);
            this.showReset = true;
            this.cdr.detectChanges();
            return;
          }
          this.serverError = err?.error?.message || 'Invalid email or password';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── FIRST-LOGIN RESET ────────────────────────────────────────

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

  resetPassword(): void {
    this.resetServerError = '';
    if (!this.validateReset()) return;

    this.resetLoading = true;
    this.cdr.detectChanges();

    this.apiService.resetPassword({ email: this.resetEmail, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.resetLoading = false;
          this.resetSuccess = true;
          this.cdr.detectChanges();
          localStorage.removeItem('resetEmail');
          setTimeout(() => {
            this.ngZone.run(() => {
              this.showReset = false;
              this.email = this.resetEmail;
              this.password = '';
              this.newPassword = '';
              this.confirmPassword = '';
              this.resetEmail = '';
              this.resetSuccess = false;
              this.cdr.detectChanges();
            });
          }, 1500);
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.resetLoading = false;
          this.resetServerError = err.error?.message || 'Reset failed. Please try again.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── FORGOT PASSWORD ──────────────────────────────────────────

  openForgotPassword(): void {
    this.showForgotPassword = true;
    this.otpSent = false;
    this.forgotEmail = '';
    this.forgotOtp = '';
    this.forgotNewPassword = '';
    this.forgotConfirmPassword = '';
    this.forgotErrors = {};
    this.forgotServerError = '';
    this.forgotSuccess = false;
    this.forgotLoading = false;
    this.forgotOtpLoading = false;
    this.showForgotNewPwd = false;
    this.showForgotConfirmPwd = false;
    this.cdr.detectChanges();
  }

  backToLogin(): void {
    this.showForgotPassword = false;
    this.otpSent = false;
    this.forgotEmail = '';
    this.forgotOtp = '';
    this.forgotNewPassword = '';
    this.forgotConfirmPassword = '';
    this.forgotErrors = {};
    this.forgotServerError = '';
    this.forgotSuccess = false;
    this.forgotLoading = false;
    this.forgotOtpLoading = false;
    this.cdr.detectChanges();
  }

  clearForgotError(field: keyof typeof this.forgotErrors): void {
    this.forgotErrors[field] = '';
    this.forgotServerError = '';
  }

  validateForgotEmail(): boolean {
    this.forgotErrors = {};
    const raw = this.forgotEmail?.trim() ?? '';
    if (!raw) { this.forgotErrors.email = 'Email is required.'; return false; }
    if (raw.startsWith('@')) { this.forgotErrors.email = "Email address cannot start with '@'."; return false; }
    if (/^[^a-zA-Z0-9]/.test(raw)) { this.forgotErrors.email = 'Email address cannot start with special characters.'; return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) { this.forgotErrors.email = 'Enter a valid email address.'; return false; }
    return true;
  }

  validateForgotReset(): boolean {
    this.forgotErrors = {};
    let valid = true;
    if (!this.forgotOtp?.trim()) { this.forgotErrors.otp = 'OTP is required.'; valid = false; }
    if (!this.forgotNewPassword) {
      this.forgotErrors.newPassword = 'New password is required.'; valid = false;
    } else if (this.forgotNewPassword.length < 8) {
      this.forgotErrors.newPassword = 'Password must be at least 8 characters.'; valid = false;
    }
    if (!this.forgotConfirmPassword) {
      this.forgotErrors.confirmPassword = 'Please confirm your password.'; valid = false;
    } else if (this.forgotNewPassword !== this.forgotConfirmPassword) {
      this.forgotErrors.confirmPassword = 'Passwords do not match.'; valid = false;
    }
    return valid;
  }

  sendOtp(): void {
    this.forgotServerError = '';
    if (!this.validateForgotEmail()) return;

    this.forgotOtpLoading = true;
    this.cdr.detectChanges();

    this.apiService.forgotPassword(this.forgotEmail.trim()).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.forgotOtpLoading = false;
          this.otpSent = true;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.forgotOtpLoading = false;
          this.forgotServerError = err?.error?.message || 'Failed to send OTP. Please try again.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  forgotPasswordReset(): void {
    this.forgotServerError = '';
    if (!this.validateForgotReset()) return;

    this.forgotLoading = true;
    this.cdr.detectChanges();

    this.apiService.verifyOtpAndResetPassword(
      this.forgotEmail.trim(),
      this.forgotOtp.trim(),
      this.forgotNewPassword
    ).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.forgotLoading = false;
          this.forgotSuccess = true;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.ngZone.run(() => { this.backToLogin(); });
          }, 2000);
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.forgotLoading = false;
          this.forgotServerError = err?.error?.message || 'Password reset failed. Please try again.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── CREATE ACCOUNT (NEW) ─────────────────────────────────────

  openCreateAccount(): void {
    this.showCreateAccount = true;
    this.signupUsername = '';
    this.signupEmail = '';
    this.signupPassword = '';
    this.signupConfirmPassword = '';
    this.signupDepartment = '';
    this.signupErrors = {};
    this.signupServerError = '';
    this.signupSuccess = false;
    this.signupLoading = false;
    this.showSignupPwd = false;
    this.showSignupConfirmPwd = false;
    this.cdr.detectChanges();
  }

  backToLoginFromSignup(): void {
    this.showCreateAccount = false;
    this.signupErrors = {};
    this.signupServerError = '';
    this.cdr.detectChanges();
  }

  clearSignupError(field: keyof typeof this.signupErrors): void {
    this.signupErrors[field] = '';
    this.signupServerError = '';
  }

  onSignupPasswordInput(): void {
    this.clearSignupError('password');
  }

  private validateSignup(): boolean {
    this.signupErrors = {};
    let valid = true;

    const username = this.signupUsername?.trim() ?? '';
    if (!username) {
      this.signupErrors.username = 'Username is required.'; valid = false;
    } else if (username.length < 2) {
      this.signupErrors.username = 'Username must be at least 2 characters.'; valid = false;
    }

    if (!this.signupDepartment) {
      this.signupErrors.department = 'Please select a department.'; valid = false;
    }

    const rawEmail = this.signupEmail?.trim() ?? '';
    if (!rawEmail) {
      this.signupErrors.email = 'Email is required.'; valid = false;
    } else if (rawEmail.startsWith('@')) {
      this.signupErrors.email = "Email address cannot start with '@'."; valid = false;
    } else if (/^[^a-zA-Z0-9]/.test(rawEmail)) {
      this.signupErrors.email = 'Email address cannot start with special characters.'; valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
      this.signupErrors.email = 'Enter a valid email address.'; valid = false;
    }

    if (!this.signupPassword) {
      this.signupErrors.password = 'Password is required.'; valid = false;
    } else if (this.signupPassword.length < 8) {
      this.signupErrors.password = 'Password must be at least 8 characters.'; valid = false;
    } else if (!/[A-Z]/.test(this.signupPassword)) {
      this.signupErrors.password = 'Password must contain at least one uppercase letter.'; valid = false;
    } else if (!/[a-z]/.test(this.signupPassword)) {
      this.signupErrors.password = 'Password must contain at least one lowercase letter.'; valid = false;
    } else if (!/[0-9]/.test(this.signupPassword)) {
      this.signupErrors.password = 'Password must contain at least one number.'; valid = false;
    } else if (!/[^A-Za-z0-9]/.test(this.signupPassword)) {
      this.signupErrors.password = 'Password must contain at least one special character.'; valid = false;
    }

    if (!this.signupConfirmPassword) {
      this.signupErrors.confirmPassword = 'Please confirm your password.'; valid = false;
    } else if (this.signupPassword !== this.signupConfirmPassword) {
      this.signupErrors.confirmPassword = 'Passwords do not match.'; valid = false;
    }

    return valid;
  }

  register(): void {
    this.signupServerError = '';
    if (!this.validateSignup()) return;

    this.signupLoading = true;
    this.cdr.detectChanges();

    this.apiService.register({
      username: this.signupUsername.trim(),
      email: this.signupEmail.trim().toLowerCase(),
      password: this.signupPassword,
      department: this.signupDepartment,
    }).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.signupLoading = false;
          this.signupSuccess = true;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.ngZone.run(() => {
              this.email = this.signupEmail.trim().toLowerCase();
              this.password = '';
              this.backToLoginFromSignup();
            });
          }, 1800);
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.signupLoading = false;
          this.signupServerError = err?.error?.message || 'Registration failed. Please try again.';
          this.cdr.detectChanges();
        });
      }
    });
  }
}