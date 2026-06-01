import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, filter } from 'rxjs/operators';
import { ApiService } from '../Service/ApiService ';

@Component({
  selector: 'app-slot-selection-component',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './slot-selection-component.html',
  styleUrls: ['./slot-selection-component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotSelectionComponent implements OnInit, OnDestroy {

  token!: string;
  candidateName = '';

  availableSlots: string[] = [];
  selectedSlot = '';
  confirmedSlot = '';

 
  loadingSlots = false;
 
  submitting = false;
  
  errorMessage = '';
  isInterviewScheduled = false;

  countdown = 5;
  cannotAutoClose = false;
  private countdownRef: ReturnType<typeof setInterval> | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  
  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        
        filter((params) => !!params['token']),
        
        switchMap((params) => {
          this.token = params['token'];
          this.candidateName = params['name'] ?? '';
          this.loadingSlots = true;
          this.errorMessage = '';
          this.cdr.markForCheck(); 
          return this.apiService.getSlots(this.token);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response: any) => {
          this.availableSlots = this.normaliseSlots(response);
          this.loadingSlots = false;
          this.cdr.markForCheck(); 
        },
        error: (err) => {
          this.loadingSlots = false;
          this.errorMessage =
            err?.error?.message ??
            'Unable to fetch available slots. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCountdown();
  }

  
  private normaliseSlots(response: any): string[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.slots)) return response.slots;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }

  selectSlot(slot: string): void {
    this.selectedSlot = slot;
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  
  confirmSlot(): void {
    if (!this.selectedSlot || this.submitting) return;

    this.submitting = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const payload = { token: this.token, selectedSlot: this.selectedSlot };

    this.apiService
      .selectSlot(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.confirmedSlot = this.selectedSlot;
          this.submitting = false;
          this.isInterviewScheduled = true;
          this.cdr.markForCheck();
          this.startAutoClose();
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage =
            err?.error?.message ??
            'Unable to confirm your slot. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  retryLoad(): void {
    this.errorMessage = '';
    this.availableSlots = [];
    this.selectedSlot = '';
    this.loadingSlots = true;
    this.cdr.markForCheck();

    this.apiService
      .getSlots(this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.availableSlots = this.normaliseSlots(response);
          this.loadingSlots = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.loadingSlots = false;
          this.errorMessage =
            err?.error?.message ?? 'Unable to fetch slots. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  

  private startAutoClose(): void {
    this.countdown = 5;
    this.countdownRef = setInterval(() => {
      this.countdown--;
      this.cdr.markForCheck();
      if (this.countdown <= 0) {
        this.clearCountdown();
        this.closePage();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownRef !== null) {
      clearInterval(this.countdownRef);
      this.countdownRef = null;
    }
  }

  closePage(): void {
    try {
      window.close();
      
      setTimeout(() => {
        if (!window.closed) {
          this.cannotAutoClose = true;
          this.cdr.markForCheck();
        }
      }, 600);
    } catch {
      this.cannotAutoClose = true;
      this.cdr.markForCheck();
    }
  }
}