import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject,} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { ApiService } from '../Service/ApiService ';

export type AttendanceStatus =
  | 'NOT_CHECKED_IN'
  | 'CHECKED_IN'
  | 'CHECKED_OUT';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  templateUrl: './employee-dashboard-component.html',
  styleUrl: './employee-dashboard-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeDashboardComponent
  implements OnInit, OnDestroy
{
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  showLogoutModal = false;

  confirmLogout(): void {
    this.showLogoutModal = true;
    this.cdr.markForCheck();
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
    this.cdr.markForCheck();
  }

  logout(): void {
    this.showLogoutModal = false;
    localStorage.clear();
    this.router.navigate(['/PortalLogin']);
  }

  employeeName = '';
  employeeId = '';
  attendanceDays = 0;
  leaveBalance = 0;
  employeeAssets: any[] = [];
  todayAttendance: any = null;

  initialLoading = true;
  checkingIn = false;
  checkingOut = false;

  toast: {
    message: string;
    type: 'success' | 'error';
  } | null = null;

  private toastTimer: any;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.employeeName =
      localStorage.getItem('employeeName') || 'Employee';

    const storedId = localStorage.getItem('employeeId');

    if (
      storedId &&
      storedId !== 'undefined' &&
      storedId !== 'null'
    ) {
      this.employeeId = storedId;
      this.loadDashboard();
    } else {
      console.error(
        'Employee ID missing from localStorage'
      );
      this.initialLoading = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }

  get attendanceStatus(): AttendanceStatus {

  if (!this.todayAttendance?.checkInTime) {
    return 'NOT_CHECKED_IN';
  }

  if (
    this.todayAttendance?.checkInTime &&
    !this.todayAttendance?.checkOutTime
  ) {
    return 'CHECKED_IN';
  }

  return 'CHECKED_OUT';
}

  get employeeInitial(): string {
    return (this.employeeName || 'E')
      .charAt(0)
      .toUpperCase();
  }

  loadDashboard(): void {
    this.initialLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      attendance:
        this.apiService.getTotalAttendance(
          this.employeeId
        ),
      leave:
        this.apiService.getLeaveBalance(
          this.employeeId
        ),
      today:
        this.apiService.getTodayAttendance(
          this.employeeId
        ),
      assets:
        this.apiService.getEmployeeAssets(
          this.employeeId
        ),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.initialLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.attendanceDays =
            res.attendance?.attendanceDays ?? 0;

          this.leaveBalance =
            res.leave?.leaveBalance ?? 0;

          this.todayAttendance =
            res.today ?? null;

          this.employeeAssets = Array.isArray(
            res.assets
          )
            ? res.assets
            : [];

          this.cdr.markForCheck();
        },

        error: (err) => {
          console.error(
            'Dashboard load error:',
            err
          );

          this.showToast(
            'Failed to load dashboard data',
            'error'
          );
        },
      });
  }

  checkIn(): void {

  if (this.attendanceStatus !== 'NOT_CHECKED_IN') {
    return;
  }

  this.checkingIn = true;

  this.cdr.markForCheck();

  this.apiService
    .employeeCheckIn(this.employeeId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({

      next: (response: any) => {

        // IMPORTANT FIX
        this.todayAttendance = {

          checkInTime:
            response?.checkInTime ||
            response?.checkinTime ||
            new Date().toISOString(),

          checkOutTime:
            response?.checkOutTime ||
            response?.checkoutTime ||
            null,

          workingHours:
            response?.workingHours || null
        };

        this.checkingIn = false;

        this.attendanceDays =
          (this.attendanceDays || 0) + 1;

        this.showToast(
          'Checked in successfully!',
          'success'
        );

        this.cdr.markForCheck();
      },

      error: (err) => {

        this.checkingIn = false;

        this.showToast(
          err?.error?.message ||
          'Check-in failed. Try again.',
          'error'
        );

        this.cdr.markForCheck();
      },
    });
}

  checkOut(): void {

  if (this.attendanceStatus !== 'CHECKED_IN') {
    return;
  }

  this.checkingOut = true;

  this.cdr.markForCheck();

  this.apiService
    .employeeCheckOut(this.employeeId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({

      next: (response: any) => {

        this.todayAttendance = {

          ...this.todayAttendance,

          checkOutTime:
            response?.checkOutTime ||
            response?.checkoutTime ||
            new Date().toISOString(),

          workingHours:
            response?.workingHours || 0
        };

        this.checkingOut = false;

        this.showToast(
          'Checked out successfully!',
          'success'
        );

        this.cdr.markForCheck();
      },

      error: (err) => {

        this.checkingOut = false;

        this.showToast(
          err?.error?.message ||
          'Check-out failed. Try again.',
          'error'
        );

        this.cdr.markForCheck();
      },
    });
}

  showToast(
    message: string,
    type: 'success' | 'error'
  ): void {
    clearTimeout(this.toastTimer);

    this.toast = { message, type };

    this.cdr.markForCheck();

    this.toastTimer = setTimeout(() => {
      this.toast = null;
      this.cdr.markForCheck();
    }, 3500);
  }
}