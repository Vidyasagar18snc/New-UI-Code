import { Component, OnInit, ChangeDetectorRef } from '@angular/core';  // ← add ChangeDetectorRef
import { Router } from '@angular/router';
import { ApiService } from '../Service/ApiService ';
import { OfferRequestDTO } from '../Model/OfferRequestDTO ';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-send-offer',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './offer-letter-component.html',
  styleUrls: ['./offer-letter-component.css']
})
export class OfferLetterComponent implements OnInit {

  offer: OfferRequestDTO = {
    name: '', email: '', role: '', salary: '',
    joiningDate: '', address: '', location: '',
    department: '', employmentType: 'Full-time',
    companyName: '', companyAddress: '',
    hrEmail: '', hrPhone: '', hrSignatoryName: '', hrSignatoryTitle: ''
  };

  loading = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';
  today = new Date();
  completedCount = 0;

  departments = ['Engineering', 'Product', 'Design', 'Sales', 'HR', 'Finance', 'Operations'];
  empTypes    = ['Full-time', 'Part-time', 'Contract', 'Internship'];

  checklistItems = [
    { field: 'name',        label: 'Candidate name' },
    { field: 'email',       label: 'Email address'  },
    { field: 'role',        label: 'Designation'    },
    { field: 'salary',      label: 'Salary'         },
    { field: 'joiningDate', label: 'Joining date'   },
  ];

  constructor(
    private offerService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef    // ← inject
  ) {}

  ngOnInit(): void {}

  onFieldChange(): void {
    this.completedCount = this.checklistItems
      .filter(c => this.isFieldFilled(c.field)).length;
  }

  isFieldFilled(field: string): boolean {
    return !!(this.offer as any)[field]?.toString().trim();
  }

  validate(): string | null {
    for (const c of this.checklistItems) {
      if (!this.isFieldFilled(c.field)) return c.label;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(this.offer.email)) return 'Valid email address';
    return null;
  }

  sendOffer(): void {
    const missing = this.validate();
    if (missing) {
      this.showToast('Please fill in: ' + missing, 'error');
      return;
    }
    this.loading = true;

    this.offerService.sendOffer(this.offer).subscribe({
      next: () => {
        this.loading = false;
        this.showToast('Offer letter sent successfully to ' + this.offer.email, 'success');
        this.cdr.detectChanges();     // ← show toast immediately after success
      },
      error: (err) => {
        this.loading = false;
        this.showToast('Failed to send: ' + (err?.error?.message || 'Server error'), 'error');
        this.cdr.detectChanges();     // ← show toast immediately after error
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/candidates']);
  }

  private showToast(msg: string, type: 'success' | 'error'): void {
    this.toastMsg  = msg;
    this.toastType = type;
    this.cdr.detectChanges();         // ← make toast appear right away

    setTimeout(() => {
      this.toastMsg = '';
      this.cdr.detectChanges();       // ← make toast disappear after 4s
    }, 4000);
  }
}