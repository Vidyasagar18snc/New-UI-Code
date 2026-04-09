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
  styleUrls: ['./uploadcomponent.css']
})
export class Uploadcomponent {

  constructor(private api: ApiService,private router: Router) {}

  selectedFiles: File[] = [];
  jobRole = '';
  language = 'auto';
  roles: string[] = [];

ngOnInit() {
  this.api.getAllJobs().subscribe((jobs: any[]) => {
    this.roles = jobs.map(j => j.title);
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
    alert('Select file');
    return;
  }

  if (!this.jobRole || this.jobRole.trim() === '') {
    alert('Enter job role'); // ✅ NEW VALIDATION
    return;
  }

  this.selectedFiles.forEach(file => {
    this.api.uploadResume(file, this.jobRole).subscribe({
      next: (res) => {
        console.log('Uploaded:', res);
      },
      error: (err) => {
        console.error(err);
      }
    });
  });

  alert('Upload Successful');

  setTimeout(() => {
    this.router.navigate(['/dashboard']);
  }, 500);
}
}