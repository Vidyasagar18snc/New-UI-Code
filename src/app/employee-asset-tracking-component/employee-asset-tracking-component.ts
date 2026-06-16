import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';

@Component({
  selector: 'app-employee-asset-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-asset-tracking-component.html',
  styleUrls: ['./employee-asset-tracking-component.css']
})
export class EmployeeAssetTrackingComponent implements OnInit {

  assetTracking: any[] = [];
  filteredAssets: any[] = [];
  loading = true;
  searchQuery = '';
  totalEmployees = 0;

  recentActivities = [
    { text: 'HP Laptop 15s assigned to Vidyasagar',         time: '23 May 2025, 10:15 AM', isReturn: false },
    { text: 'Logitech Wireless Mouse assigned to Vidyasagar', time: '23 May 2025, 10:15 AM', isReturn: false },
    { text: 'Dell Laptop returned by Rahul Kumar',           time: '14 Mar 2025, 04:20 PM', isReturn: true  },
    { text: 'HP Monitor 24" assigned to Anjali Sharma',      time: '05 Feb 2025, 11:30 AM', isReturn: false },
  ];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef   // ← inject this
  ) {}

  ngOnInit(): void {
    this.getAssetTracking();
    this.getTotalEmployeesCount();
  }

  private normaliseResponse(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }


  getAssetTracking(): void {
    this.loading = true;

    this.apiService.getAssetTracking().subscribe({
      next: (response: any) => {
        // ✅ THE FIX: normalise before assigning
        const data = this.normaliseResponse(response);
        this.assetTracking = data;
        this.filteredAssets = data;
        this.loading = false;
        this.cdr.detectChanges();   // force view update immediately
      },
      error: (err) => {
        console.error('Failed to load asset tracking:', err);
        this.assetTracking = [];
        this.filteredAssets = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  onSearch(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredAssets = this.assetTracking;
      return;
    }
    this.filteredAssets = this.assetTracking.filter(item =>
      (item.employeeName?.toLowerCase().includes(q)) ||
      (item.employeeId?.toLowerCase().includes(q))  ||
      (item.assetName?.toLowerCase().includes(q))   ||
      (item.category?.toLowerCase().includes(q))    ||
      (item.brand?.toLowerCase().includes(q))
    );
  }


  getAssignedCount(): number {
    return this.assetTracking.filter(a => a.status === 'ASSIGNED').length;
  }

  getReturnedCount(): number {
    return this.assetTracking.filter(a => a.status === 'RETURNED').length;
  }


  getTotalEmployeesCount(): void {
    this.apiService.getTotalEmployeesCount().subscribe({
      next: (response: any) => {
        // Guard against the same wrapping issue on this endpoint too
        this.totalEmployees = typeof response === 'number'
          ? response
          : (response?.data ?? response?.count ?? 0);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching employee count:', err);
      }
    });
  }
}