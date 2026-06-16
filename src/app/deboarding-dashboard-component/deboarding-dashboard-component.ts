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
  selectedEmployeeId = '';
  assetError = false;

  deboarding = {
    employeeId: '',
    reason: '',
    lastWorkingDate: '',
    remarks: ''
  };

  employeeId = '';
  ktAvailable = false;
  selectedFile!: File;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,   //  inject this
    private router:Router
  ) {}

  ngOnInit(): void {
    this.getAllDeboarding();
    this.assetError = true;
  }

  onFileSelected(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  initiateKT(): void {
    if (!this.employeeId) {
      alert('Please enter Employee ID');
      return;
    }

    const formData = new FormData();
    formData.append('employeeId', this.employeeId);

    if (this.ktAvailable && this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.apiService.initiateKT(formData).subscribe({
      next: (response: any) => {
        this.selectedEmployeeId = this.employeeId;
        alert(response.message);
        this.employeeId = '';
        this.ktAvailable = false;
        this.selectedFile = undefined as any;
      },
      error: (err: any) => {
        alert(err.error?.message || 'KT failed');
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
      },
      error: (err: any) => {
        alert(err.error?.message || 'KT completion failed');
      }
    });
  }

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
        alert(err.error?.error || err.error?.message || 'Deboarding failed');
      }
    });
  }

  getAllDeboarding(): void {
    this.apiService.getAllDeboarding().subscribe({
      next: (response: any) => {
        this.deboardingRecords = [...response];  // new array reference
        this.cdr.detectChanges();                //  force UI update
      },
      error: (err) => {
        console.error('Failed to fetch records', err);
      }
    });
  }
  goToAssets(): void {
  this.router.navigate(['/assestdashboard']);
}
}