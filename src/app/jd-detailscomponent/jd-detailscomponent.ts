import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ApiService } from '../Service/ApiService ';
import { Job } from '../Model/Job ';

interface Toast {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

interface EditForm {
  title: string;
  department: string;
  budget: string;
  experience: number | null;
  location: string;
  status: string;
  skillsRaw: string; // comma-separated string for the input
  description: string;
}

interface EditErrors {
  title: boolean;
  experience: boolean;
  location: boolean;
  skills: boolean;
  description: boolean;
  budget: boolean;
}

@Component({
  selector: 'app-jd-detailscomponent',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './jd-detailscomponent.html',
  styleUrls: ['./jd-detailscomponent.css'],
})
export class JdDetailscomponent implements OnInit {
  jobs: Job[] = [];
  filteredJobs: Job[] = [];

  loading = true;
  searchQuery = '';

  selectedJob: Job | null = null;

  editingJob: Job | null = null; // the original Job being edited
  saving = false;

  editForm: EditForm = this.blankEditForm();
  editErrors: EditErrors = this.blankEditErrors();

  jobToDelete: Job | null = null;
  deleting = false;

  toast: Toast = { visible: false, message: '', type: 'success' };
  private toastTimer: any;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) { }

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading = true;

    this.api.getAllJobs().subscribe({
      next: (res: any) => {
        const jobsData = Array.isArray(res) ? res : (res?.data ?? []);

        this.zone.run(() => {
          this.jobs = jobsData.map((j: any) => this.normalizeJob(j));
          this.filteredJobs = [...this.jobs];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.zone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  private normalizeJob(job: any): Job {
    return {
      ...job,
      skills: Array.isArray(job.skills)
        ? job.skills.length === 1 && job.skills[0].includes(',')
          ? job.skills[0].split(',').map((s: string) => s.trim())
          : [...job.skills]
        : [],
      location: job.location || 'Not provided',
      budget: job.budget || 'Not specified',
      description: job.description || 'No description available.',
      status: job.status ?? 'active',
      aiMatchScore: job.aiMatchScore ?? null,
      aiSkillScore: job.aiSkillScore ?? null,
      aiExpScore: job.aiExpScore ?? null,
      isExpanded: false,
    };
  }

  filterJobs(): void {
    const q = this.searchQuery.toLowerCase().trim();

    this.filteredJobs = q
      ? this.jobs.filter(
        (j: any) =>
          j.title?.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q) ||
          (j.department ?? '').toLowerCase().includes(q) ||
          j.skills?.some((s: any) => s.toLowerCase().includes(q)),
      )
      : [...this.jobs];

    this.cdr.detectChanges();
  }

  trackByJob(_: number, job: any): any {
    return job.id || job._id || _;
  }

  get totalJobs(): number {
    return this.jobs.length;
  }
  get analyzedCount(): number {
    return this.jobs.filter((j) => j.aiMatchScore != null).length;
  }
  get openPositions(): number {
    return this.jobs.filter((j) => (j.status ?? 'active') === 'active').length;
  }

  openModal(job: Job): void {
    this.selectedJob = job;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedJob = null;
    document.body.style.overflow = '';
  }

  openEditModal(job: Job): void {
    this.editingJob = job;
    this.editErrors = this.blankEditErrors();
    this.saving = false;

    this.editForm = {
      title: job.title ?? '',
      department: (job as any).department ?? '',
      budget: (job as any).budget ?? '',
      experience: job.experience ?? null,
      location: job.location ?? '',
      status: job.status ?? 'active',
      skillsRaw: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      description: job.description ?? '',
    };

    document.body.style.overflow = 'hidden';
  }

  closeEditModal(): void {
    this.editingJob = null;
    document.body.style.overflow = '';
  }

  get previewSkills(): string[] {
    return this.editForm.skillsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private validateEditForm(): boolean {
    this.editErrors = {
      title: !this.editForm.title.trim(),
      experience: this.editForm.experience === null || this.editForm.experience < 0,
      location: !this.editForm.location.trim(),
      budget: !this.editForm.budget.trim(),

      skills: this.previewSkills.length === 0,
      description: !this.editForm.description.trim(),
    };
    return !Object.values(this.editErrors).some(Boolean);
  }

  saveEdit(): void {
    if (!this.validateEditForm() || !this.editingJob) return;

    const id = (this.editingJob as any).id ?? (this.editingJob as any)._id;

    // Build the updated payload
    const payload: Partial<Job> = {
      ...this.editingJob,
      title: this.editForm.title.trim(),
      department: this.editForm.department.trim() || undefined,
      experience: Number(this.editForm.experience),
      location: this.editForm.location.trim(),
      budget: this.editForm.budget.trim(),
      status: this.editForm.status,
      skills: this.previewSkills,
      description: this.editForm.description.trim(),
    } as Partial<Job>;

    this.saving = true;

    this.api.updateJob(id, payload).subscribe({
      next: (updated: any) => {
        this.zone.run(() => {
          const normalized = this.normalizeJob({
            ...this.editingJob,
            ...payload,
            ...(updated ?? {}),
          });

          const idx = this.jobs.findIndex((j) => (j as any).id === id || (j as any)._id === id);
          const filteredIdx = this.filteredJobs.findIndex(
            (j) => (j as any).id === id || (j as any)._id === id,
          );

          if (idx !== -1) this.jobs[idx] = normalized;
          if (filteredIdx !== -1) this.filteredJobs[filteredIdx] = normalized;

          // Force a new array reference so Angular's change detection picks up the mutation
          this.jobs = [...this.jobs];
          this.filteredJobs = [...this.filteredJobs];

          this.saving = false;
          this.closeEditModal();
          this.showToast('Job description updated successfully.', 'success');
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error updating job:', err);
        this.zone.run(() => {
          this.saving = false;
          this.showToast('Failed to update job description. Please try again.', 'error');
          this.cdr.detectChanges();
        });
      },
    });
  }

  confirmDelete(job: Job): void {
    this.jobToDelete = job;
    document.body.style.overflow = 'hidden';
  }

  cancelDelete(): void {
    this.jobToDelete = null;
    document.body.style.overflow = '';
  }

  executeDelete(): void {
    if (!this.jobToDelete) return;

    const id = this.jobToDelete.id;
    this.deleting = true;

    this.api.deleteJob(id).subscribe({
      next: () => {
        this.zone.run(() => {
          // 1. Update the data arrays
          this.jobs = this.jobs.filter((j) => j.id !== id);
          this.filteredJobs = this.filteredJobs.filter((j) => j.id !== id);
          alert('✅ Job deleted successfully!');

          this.toast = { visible: true, message: 'Job deleted successfully.', type: 'success' };

          // 3. Clear the modal — this triggers *ngIf teardown
          this.jobToDelete = null;
          document.body.style.overflow = '';
          this.deleting = false;

         
          clearTimeout(this.toastTimer);
          this.toastTimer = setTimeout(() => {
            this.toast.visible = false;
            this.cdr.detectChanges();
          }, 3500);

          this.cdr.detectChanges();
        });
      },

      error: (err) => {
        this.zone.run(() => {
          console.error('Delete Error:', err);
          this.deleting = false;

          this.toast = {
            visible: true,
            message: err?.error?.message || err?.error || 'Failed to delete job.',
            type: 'error',
          };
          this.jobToDelete = null;
          document.body.style.overflow = '';

          clearTimeout(this.toastTimer);
          this.toastTimer = setTimeout(() => {
            this.toast.visible = false;
            this.cdr.detectChanges();
          }, 3500);

          this.cdr.detectChanges();
        });
      },
    });
  }

  showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast = { visible: true, message, type };
    this.toastTimer = setTimeout(() => {
      this.toast.visible = false;
      this.cdr.detectChanges();
    }, 3500);
  }

  proceedJob(job: Job): void {
    console.log('Proceed to matching:', job);
  }

  addJob(): void {
    console.log('Add new job');
  }

  statusClass(status: string): string {
    return status === 'active' ? 'dot-active' : status === 'draft' ? 'dot-draft' : 'dot-closed';
  }

  statusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  hasAiScores(job: Job): boolean {
    return job.aiMatchScore != null;
  }

  private blankEditForm(): EditForm {
    return {
      title: '',
      department: '',
      budget: '',
      experience: null,
      location: '',
      status: 'active',
      skillsRaw: '',
      description: '',
    };
  }

  private blankEditErrors(): EditErrors {
    return { title: false, experience: false, location: false, skills: false, description: false, budget: false, };
  }
}
