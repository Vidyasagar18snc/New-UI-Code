import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-hr-document-verification',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './hr-document-verification-component.html',
  styleUrl: './hr-document-verification-component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class HrDocumentVerificationComponent implements OnInit {

  candidates: any[] = [];
  loading = true;
  verifyingCandidateId: string | null = null;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef   // ← inject this
  ) {}

  ngOnInit(): void {
    this.getCandidates();
  }

  getCandidates(): void {
    this.loading = true;
    this.apiService.getDocuments().subscribe({
      next: (response: any) => {
        this.candidates = Array.isArray(response) ? [...response] : [];  // ← spread into new array
        this.loading = false;
        this.cdr.detectChanges();   // ← force change detection
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();   // ← also here
        alert('Failed to load candidates');
      }
    });
  }

  verifyAllDocuments(candidateId: string): void {
    this.verifyingCandidateId = candidateId;

    this.apiService.verifyAllDocuments(candidateId).subscribe({
      next: () => {
        // Create a new array reference so Angular detects the mutation
        this.candidates = this.candidates.map(c => {
          if (c.candidateId === candidateId) {
            return {
              ...c,
              onboardingStatus: 'VERIFIED',
              documents: c.documents?.map((doc: any) => ({
                ...doc,
                verificationStatus: 'VERIFIED',
              })),
            };
          }
          return c;
        });

        this.verifyingCandidateId = null;
        this.cdr.detectChanges();   // ← force update
        alert('All documents verified successfully');
      },
      error: (err) => {
        console.error(err);
        this.verifyingCandidateId = null;
        this.cdr.detectChanges();
        alert('Verification failed');
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('');
  }

  getStatusCount(status: string): number {
    return this.candidates.filter(c => c.onboardingStatus === status).length;
  }

  getVerifiedDocCount(candidate: any): number {
    if (!candidate.documents?.length) return 0;
    return candidate.documents.filter(
      (d: any) => d.verificationStatus === 'VERIFIED'
    ).length;
  }

  getVerifiedPercent(candidate: any): number {
    if (!candidate.documents?.length) return 0;
    return Math.round(
      (this.getVerifiedDocCount(candidate) / candidate.documents.length) * 100
    );
  }
}