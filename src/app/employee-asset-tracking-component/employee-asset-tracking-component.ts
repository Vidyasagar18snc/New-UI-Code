import { Component, OnInit } from '@angular/core';
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
  totalEmployees: number = 0;

  recentActivities = [
    { text: 'HP Laptop 15s assigned to Vidyasagar',    time: '23 May 2025, 10:15 AM', isReturn: false },
    { text: 'Logitech Wireless Mouse assigned to Vidyasagar', time: '23 May 2025, 10:15 AM', isReturn: false },
    { text: 'Dell Laptop returned by Rahul Kumar',     time: '14 Mar 2025, 04:20 PM', isReturn: true  },
    { text: 'HP Monitor 24" assigned to Anjali Sharma',time: '05 Feb 2025, 11:30 AM', isReturn: false },
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.getAssetTracking();
     this.getTotalEmployeesCount();
  }

  getAssetTracking(): void {
    this.apiService.getAssetTracking().subscribe({
      next: (response: any) => {
        this.assetTracking = response;
        this.filteredAssets = response;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
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
      (item.employeeId?.toLowerCase().includes(q)) ||
      (item.assetName?.toLowerCase().includes(q)) ||
      (item.category?.toLowerCase().includes(q)) ||
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
    next: (count: number) => {
      console.log('Total Employees:', count);
      this.totalEmployees = count;
    },
    error: (err) => {
      console.error('Error fetching employee count:', err);
    }
  });
}
  
}