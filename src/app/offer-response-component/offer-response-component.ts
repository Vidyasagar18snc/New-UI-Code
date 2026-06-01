import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,

} from '@angular/core';
import { ApiService } from '../Service/ApiService ';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-offer-response-component',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './offer-response-component.html',
  styleUrls: ['./offer-response-component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, 
})
export class OfferResponseComponent implements OnInit, OnDestroy {
  
  token!: string;
  offer: any = null;
  pdfUrl!: SafeResourceUrl;

  loading = true;
  loadError = false;


  isAccepting = false;
  offerAccepted = false;
  offerRejected = false;

  
  showPopup = false;
  popupTitle = '';
  popupMessage = '';
  popupType: 'success' | 'error' = 'success';

  showRejectPopup = false;
  rejectionReason = '';
  rejectionComment = '';
  isSubmittingRejection = false;
  rejectionSubmitted = false;


  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any;
  showReasonError = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
   
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          this.token = params.get('token')!;
          this.loading = true;
          this.loadError = false;
          this.cdr.markForCheck();
          return this.apiService.getOfferByToken(this.token);
        }),
      )
      .subscribe({
        next: (response) => {
          this.offer = response;
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.offerPdfUrl);
          this.loading = false;
          this.cdr.markForCheck(); // Trigger OnPush detection
        },
        error: (err) => {
          console.error('Failed to load offer:', err);
          this.loading = false;
          this.loadError = true;
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ─── Accept ──────────────────────────────────────────────────────────────

  respondOffer(action: string): void {
    if (action !== 'accept' || this.isAccepting || this.offerAccepted) return;

    this.isAccepting = true;
    this.cdr.markForCheck();

    this.apiService
      .respondOffer(this.token, 'accept')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isAccepting = false;
          this.offerAccepted = true;
          this.popupType = 'success';
          this.popupTitle = 'Offer Accepted';
          this.popupMessage =
            'Congratulations! Your offer has been accepted successfully. The HR team will contact you shortly regarding the onboarding process.';
          this.showPopup = true;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Accept offer failed:', err);
          this.isAccepting = false;
          this.popupType = 'error';
          this.popupTitle = 'Submission Failed';
          this.popupMessage =
            'Unable to accept the offer at this time. Please try again or contact HR.';
          this.showPopup = true;
          this.cdr.markForCheck();
          // Auto close after 3 seconds
          setTimeout(() => {
            this.showPopup = false;
            this.cdr.markForCheck();
            try {
              window.open('', '_self');
              window.close();
            } catch (e) {
              console.error('Unable to close tab', e);
            }
          }, 3000);
        },
      });
  }

  // ─── Reject modal ────────────────────────────────────────────────────────

  openRejectPopup(): void {
    this.showRejectPopup = true;
    this.rejectionReason = '';
    this.rejectionComment = '';
    this.showReasonError = false;
    this.cdr.markForCheck();
  }

  closeRejectPopup(): void {
    if (this.isSubmittingRejection) return; // Prevent close during submission
    this.showRejectPopup = false;
    this.rejectionReason = '';
    this.rejectionComment = '';
    this.showReasonError = false;
    this.cdr.markForCheck();
  }

  onReasonChange(): void {
    if (this.rejectionReason) {
      this.showReasonError = false;
      this.cdr.markForCheck();
    }
  }

  get isSubmitDisabled(): boolean {
    if (!this.rejectionReason) return true;
    if (this.rejectionReason === 'Other' && !this.rejectionComment.trim()) return true;
    return this.isSubmittingRejection;
  }

  submitRejectOffer(): void {
    if (this.isSubmitDisabled) {
      this.showReasonError = true;
      this.cdr.markForCheck();
      return;
    }

    // Prevent double submission
    if (this.isSubmittingRejection) return;

    const finalReason =
      this.rejectionReason === 'Other' ? this.rejectionComment.trim() : this.rejectionReason;

    this.isSubmittingRejection = true;
    this.showReasonError = false;
    this.cdr.markForCheck();

    this.apiService
      .respondOffer(this.token, 'reject', finalReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmittingRejection = false;
          this.offerRejected = true;
          this.showRejectPopup = false;
          this.popupType = 'success';
          this.popupTitle = 'Offer Rejected';
          this.popupMessage =
            'Your rejection has been submitted successfully. We appreciate you letting us know.';
          this.showPopup = true;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Reject offer failed:', err);
          this.isSubmittingRejection = false;
          this.showToastMessage('Unable to submit rejection. Please try again.', 'error');
          this.cdr.markForCheck();
          // Auto close after 3 seconds
          setTimeout(() => {
            this.showPopup = false;
            this.cdr.markForCheck();

            try {
              window.open('', '_self');
              window.close();
            } catch (e) {
              console.error('Unable to close tab', e);
            }
          }, 3000);
        },
      });
  }

  // ─── Popup / Toast helpers ────────────────────────────────────────────────

  closePopup(): void {
    this.showPopup = false;
    this.cdr.markForCheck();
  }

  showToastMessage(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.markForCheck();
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
      this.cdr.markForCheck();
    }, 4000);
  }
}
