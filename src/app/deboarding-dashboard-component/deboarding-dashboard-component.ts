import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';
import { Router } from '@angular/router';

@Component({
  selector: 'app-deboarding-dashboard-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deboarding-dashboard-component.html',
  styleUrls: ['./deboarding-dashboard-component.css']
})
export class DeboardingDashboardComponent implements OnInit {

  deboardingRecords: any[] = [];
  ktRecords: any[] = [];           // ← KT records for who→whom table

  selectedEmployeeId = '';
  assetError = false;

  deboarding = {
    employeeId: '',
    reason: '',
    lastWorkingDate: '',
    remarks: ''
  };

  // KT form fields
  employeeId = '';
  transferToEmployeeId = '';       // ← NEW: who receives the KT
  ktAvailable = false;
  selectedFile!: File;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getAllDeboarding();
    this.getAllKTRecords();
    this.assetError = false;
  }

  // ── FILE SELECTION ────────────────────────────────────────────────────────

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  // ── KT ────────────────────────────────────────────────────────────────────

  initiateKT(): void {
    if (!this.employeeId) {
      alert('Please enter Employee ID');
      return;
    }
    if (!this.transferToEmployeeId) {
      alert('Please enter Transfer-To Employee ID');
      return;
    }
    if (this.ktAvailable && !this.selectedFile) {
      alert('Please upload a KT document');
      return;
    }

    const formData = new FormData();
    formData.append('employeeId', this.employeeId);
    formData.append('transferToEmployeeId', this.transferToEmployeeId);   // ← NEW

    if (this.ktAvailable && this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.apiService.initiateKT(formData).subscribe({
      next: (response: any) => {
        this.selectedEmployeeId = this.employeeId;
        alert(response.message);
        this.resetKTForm();
        this.getAllKTRecords();
      },
      error: (err: any) => {
        alert(err.error?.message || 'KT initiation failed');
      }
    });
  }

  completeKT(): void {
    if (!this.selectedEmployeeId) {
      alert('Please initiate KT first');
      return;
    }

    this.apiService.completeKT(this.selectedEmployeeId).subscribe({
      next: (response: any) => {
        alert(response.message);
        this.getAllKTRecords();
      },
      error: (err: any) => {
        alert(err.error?.message || 'KT completion failed');
      }
    });
  }

  resetKTForm(): void {
    this.employeeId = '';
    this.transferToEmployeeId = '';
    this.ktAvailable = false;
    this.selectedFile = undefined as any;
  }

  // ── DEBOARDING ────────────────────────────────────────────────────────────

  initiateDeboarding(): void {
    const initiatedBy = localStorage.getItem('employeeName') || 'HR';

    const payload = {
      ...this.deboarding,
      initiatedBy,
      lastWorkingDate: this.deboarding.lastWorkingDate
        ? new Date(this.deboarding.lastWorkingDate).toISOString().split('T')[0]
        : ''
    };

    this.apiService.initiateDeboarding(payload).subscribe({
      next: () => {
        alert('Deboarding Completed');
        this.deboarding = {
          employeeId: '',
          reason: '',
          lastWorkingDate: '',
          remarks: ''
        };
        setTimeout(() => this.getAllDeboarding(), 300);
      },
      error: (err) => {
        const msg = err.error?.error || err.error?.message || '';
        if (msg.toLowerCase().includes('asset')) {
          this.assetError = true;
        }
        alert(msg || 'Deboarding failed');
      }
    });
  }

  // ── DATA FETCH ────────────────────────────────────────────────────────────

  getAllDeboarding(): void {
    this.apiService.getAllDeboarding().subscribe({
      next: (response: any) => {
        this.deboardingRecords = [...response];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch deboarding records', err);
      }
    });
  }

  getAllKTRecords(): void {
    this.apiService.getAllKTRecords().subscribe({
      next: (response: any) => {
        this.ktRecords = [...response];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch KT records', err);
      }
    });
  }


 goToAssets(): void {
  this.router.navigate(['/assestdashboard']);
}
}