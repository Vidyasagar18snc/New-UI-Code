import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';

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

  deboarding = {
    employeeId: '',
    reason: '',
    lastWorkingDate: '',
    remarks: ''
  };

  kt = {
    employeeId: '',
    projectName: '',
    taskDetails: '',
    documentationLink: '',
    credentialsShared: '',
    transferredTo: '',
    remarks: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.getAllDeboarding();
  }

  // KT START
  initiateKT(): void {

  this.apiService.initiateKT(this.kt).subscribe({

    next: () => {

      // SAVE EMPLOYEE ID

      this.selectedEmployeeId =
      this.kt.employeeId;

      alert('KT Initiated');

      this.kt = {

        employeeId: '',

        projectName: '',

        taskDetails: '',

        documentationLink: '',

        credentialsShared: '',

        transferredTo: '',

        remarks: ''
      };
    },

    error: (err) => {

      alert(

        err.error?.message ||

        'KT failed'
      );
    }
  });
}

  // COMPLETE KT
  completeKT(employeeId: string): void {

    this.apiService.completeKT(employeeId).subscribe({

      next: () => {
        alert('KT Completed');
      },

      error: (err) => {
        alert(err.error?.message || 'KT completion failed');
      }
    });
  }

  // DEBOARDING
  initiateDeboarding(): void {

    const initiatedBy =
      localStorage.getItem('employeeName') || 'HR';

    const payload = {
      ...this.deboarding,
      initiatedBy
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

        this.getAllDeboarding();
      },

      error: (err) => {
        alert(err.error?.message || 'Deboarding failed');
      }
    });
  }

  // FETCH
  getAllDeboarding(): void {

    this.apiService.getAllDeboarding().subscribe({

      next: (response: any) => {
        this.deboardingRecords = response;
      }
    });
  }
}