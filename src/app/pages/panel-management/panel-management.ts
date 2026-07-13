import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../Service/ApiService ';

@Component({
  selector: 'app-panel-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-management.html',
  styleUrls: ['./panel-management.css']
})
export class PanelManagement implements OnInit {

  panels: any[] = [];
  jobs: any[] = [];
  jobsError: string = '';   // shown in the UI if jobs fail to load

  panel = {
    name: '',
    email: '',
    role: '',
    password: '',
    available: true,
    jobTitle: ''
  };

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadPanels();
    this.loadJobs();
  }

  // ── JOBS DROPDOWN ────────────────────────────────────────────────────────

  loadJobs(): void {
    this.apiService.getAllJobs().subscribe({
      next: (data: any) => {
        console.log('Jobs API response:', data);   // ← check this in browser console
        this.jobs = data || [];
        if (this.jobs.length === 0) {
          this.jobsError = 'No jobs found. Create a job first.';
        } else {
          this.jobsError = '';
        }
      },
      error: (err: any) => {
        console.error('Failed to load jobs:', err);
        this.jobsError = 'Could not load job titles (check console/network tab).';
      }
    });
  }

  // Handles either `title` or `jobTitle` as the field name on the job object,
  // since we haven't confirmed which one your Job model actually uses.
  getJobLabel(job: any): string {
    return job.title || job.jobTitle || job.name || '(untitled)';
  }

  // ── PANEL CRUD ────────────────────────────────────────────────────────────

  loadPanels(): void {
    this.apiService.getPanels(this.panel.role).subscribe({
      next: (data: any) => {
        this.panels = data;
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  savePanel(): void {
    if (
      !this.panel.name ||
      !this.panel.email ||
      !this.panel.role ||
      !this.panel.password ||
      !this.panel.jobTitle
    ) {
      alert('Please fill all fields');
      return;
    }

    this.apiService.createPanel(this.panel).subscribe({
      next: (res: any) => {
        console.log('Panel saved:', res);   // ← confirm jobTitle is present here
        alert('Panel Added Successfully');
        this.resetForm();
        this.loadPanels();
      },
      error: (err: Error) => {
        console.error(err);
      }
    });
  }

  deletePanel(id: string): void {
    if (!confirm('Delete this panel?')) {
      return;
    }

    this.apiService.deletePanel(id).subscribe({
      next: () => {
        this.loadPanels();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  private resetForm(): void {
    this.panel = {
      name: '',
      email: '',
      role: '',
      password: '',
      available: true,
      jobTitle: ''
    };
  }
}