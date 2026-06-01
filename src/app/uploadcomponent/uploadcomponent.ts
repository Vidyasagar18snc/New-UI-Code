import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';
import { Router } from '@angular/router';

@Component({
  selector: 'app-uploadcomponent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './uploadcomponent.html',
  styleUrls: ['./uploadcomponent.css'],
})
export class Uploadcomponent {
  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  selectedFiles: File[] = [];
  jobRole = '';
  language = 'auto';
  roles: string[] = [];

  ngOnInit() {
    this.api.getAllJobs().subscribe((jobs: any[]) => {
      this.roles = jobs.map((j) => j.title);
    });
  }

  onFileSelect(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = [...this.selectedFiles, ...files];
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  // ✅ API INTEGRATION
  upload() {
    if (this.selectedFiles.length === 0) {
      alert('Please select resume');
      return;
    }

    if (!this.jobRole || this.jobRole.trim() === '') {
      alert('Please enter job role');
      return;
    }

    this.selectedFiles.forEach((file) => {
      this.api.uploadResume(file, this.jobRole).subscribe({
        next: (res: any) => {
          console.log('API Response:', res);

          if (res?.status === 'Duplicate Candidate') {
            alert(`${res.name} already applied for ${res.role}`);

            return;
          }

          if (res?.status === 'Shortlisted') {
            alert(`${res.name} shortlisted successfully`);
          } else if (res?.status === 'Rejected') {
            alert(`${res.name} rejected`);
          } else if (res?.status === 'Review') {
            alert(`${res.name} moved to review`);
          } else {
            alert('Resume uploaded successfully');
          }

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 600);
        },

        error: (err) => {
          console.error('FULL ERROR:', err);

          alert('Candidate already exists with same email');
        },
      });
    });
  }
  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer?.files || []);
    this.selectedFiles = [...this.selectedFiles, ...dropped];
  }
}
