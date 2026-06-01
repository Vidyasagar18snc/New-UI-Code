import { Component, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../Service/ApiService ';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employeedetails',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './employeedetails.html',
  styleUrl: './employeedetails.css',
})
export class Employeedetails {

  employees: any[] = [];
  filteredEmployees: any[] = [];
  departments: string[] = [];

  searchQuery: string = '';
  statusFilter: string = '';
  deptFilter: string = '';

  isLoading: boolean = true;

  // Computed stat counts
  get activeCount(): number {
    return this.employees.filter(e => e.status === 'ACTIVE').length;
  }

  get inactiveCount(): number {
    return this.employees.filter(e => e.status !== 'InACTIVE').length;
  }

  get departmentCount(): number {
    return new Set(this.employees.map(e => e.department)).size;
  }

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef   // ← FIX: inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getAllEmployees();
  }

  // GET ALL EMPLOYEES — FIX: trigger change detection after data loads
  getAllEmployees(): void {
    this.isLoading = true;
    this.apiService.getAllEmployees().subscribe({
      next: (response: any) => {
        this.employees = response;
        this.filteredEmployees = [...this.employees];

        // Build unique department list for the filter dropdown
        this.departments = [...new Set(this.employees.map((e: any) => e.department))].sort();

        this.isLoading = false;
        this.cdr.detectChanges();   // ← FIX: force Angular to re-render with fresh data
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // SEARCH + FILTER
  filterEmployees(): void {
    const q = this.searchQuery.toLowerCase().trim();

    this.filteredEmployees = this.employees.filter(e => {
      const matchesSearch =
        !q ||
        e.employeeName?.toLowerCase().includes(q) ||
        e.officialEmail?.toLowerCase().includes(q) ||
        e.employeeId?.toString().includes(q);

      const matchesStatus =
        !this.statusFilter || e.status === this.statusFilter;

      const matchesDept =
        !this.deptFilter || e.department === this.deptFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }

  // Get initials for avatar
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }
}