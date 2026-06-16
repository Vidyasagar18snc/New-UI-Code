import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../Service/ApiService ';


@Component({
  selector: 'app-background-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './background-verification.html',
  styleUrls: ['./background-verification.css'],
})
export class BackgroundVerification implements OnInit, OnDestroy {

  candidates: any[] = [];
  selectedCandidate: any = null;

  hrEmail = '';
  searchQuery = '';
  emailFocused = false;

  isLoadingCandidates = true;
  loading = false;
  sendSuccess = false;

  successMessage = '';
  errorMessage = '';

  private messageTimer: any = null;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadCandidates();
  }

  ngOnDestroy(): void {
    if (this.messageTimer) clearTimeout(this.messageTimer);
  }

  get filteredCandidates(): any[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.candidates;
    return this.candidates.filter(c =>
      c.candidateName?.toLowerCase().includes(q) ||
      c.role?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }

  loadCandidates(): void {
    this.isLoadingCandidates = true;

    this.apiService.getAllOnboardingCandidates()
      .pipe(finalize(() => {
        this.zone.run(() => {
          this.isLoadingCandidates = false;
          this.cdr.detectChanges();
        });
      }))
      .subscribe({
        next: (response: any) => {
          this.zone.run(() => {
            this.candidates = Array.isArray(response) ? response : [];
            this.cdr.detectChanges();
          });
        },
        error: (err: any) => {
          console.error('Failed to load candidates:', err);
        },
      });
  }

  selectCandidate(candidate: any): void {
    this.selectedCandidate = { ...candidate };
    this.hrEmail = '';
    this.successMessage = '';
    this.errorMessage = '';
    this.sendSuccess = false;
    this.loading = false;
    if (this.messageTimer) clearTimeout(this.messageTimer);
    this.cdr.detectChanges();
  }

  sendVerification(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.sendSuccess = false;

    if (!this.selectedCandidate) {
      this.errorMessage = 'Please select a candidate first.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.hrEmail.trim()) {
      this.errorMessage = 'Please enter the HR email address.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.isValidEmail(this.hrEmail.trim())) {
      this.errorMessage = 'Please enter a valid email address.';
      this.cdr.detectChanges();
      return;
    }

    const candidateId = this.selectedCandidate.id ?? this.selectedCandidate._id;
    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.sendBackgroundVerification(candidateId, this.hrEmail.trim())
      .pipe(
        // finalize runs whether success OR error — ALWAYS stops the spinner
        finalize(() => {
          this.zone.run(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (response: any) => {
          this.zone.run(() => {
            this.sendSuccess = true;
            this.successMessage =
              response?.message || 'Verification email sent successfully!';
            this.errorMessage = '';

            // Update badge on selected candidate
            this.selectedCandidate = {
              ...this.selectedCandidate,
              backgroundVerificationStatus: 'MAIL_SENT',
            };

            // Update status dot in the list
            this.candidates = this.candidates.map(c =>
              (c.id ?? c._id) === candidateId
                ? { ...c, backgroundVerificationStatus: 'MAIL_SENT' }
                : c
            );

            this.cdr.detectChanges();

           
            if (this.messageTimer) clearTimeout(this.messageTimer);
            this.messageTimer = setTimeout(() => {
              this.zone.run(() => {
                this.successMessage = '';
                this.sendSuccess = false;
                this.cdr.detectChanges();
              });
            }, 6000);
          });
        },
        error: (error: any) => {
          this.zone.run(() => {
            this.sendSuccess = false;
            this.successMessage = '';
            this.errorMessage =
              error?.error?.message ||
              'Failed to send verification email. Please try again.';
            this.cdr.detectChanges();
          });
        },
      });
  }

  getInitial(name: string): string {
    return name?.charAt(0)?.toUpperCase() ?? '?';
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}