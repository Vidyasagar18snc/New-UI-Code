import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';
import { Router } from '@angular/router';

@Component({
  selector: 'app-jdcomponent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jdcomponent.html',
  styleUrls: ['./jdcomponent.css']
})
export class Jdcomponent {

  constructor(private api: ApiService,private router: Router ) {}

  jobTitle = '';
  experience: number | null = null;
  location = '';
  description = '';
  skillInput = '';
  skills: string[] = [];
  charCount = 0;

  selectedFile: File | null = null;
  loading = false;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadJD() {
    if (!this.selectedFile) {
      alert('Please select a file first');
      return;
    }

    this.loading = true;

    this.api.uploadJD(this.selectedFile).subscribe({
      next: (res: any) => {
        console.log('Parsed JD:', res);

        this.jobTitle    = res.title       || '';
        this.experience  = res.experience  || null;
        this.location    = res.location    || '';
        this.description = res.description || '';
        this.skills      = res.skills      || [];

        this.updateCharCount();
        this.loading = false;

        alert('JD parsed successfully ✅');
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        alert('Error parsing JD');
      }
    });
  }

  addSkill() {
    const trimmed = this.skillInput.trim();
    if (trimmed && !this.skills.includes(trimmed)) {
      this.skills.push(trimmed);
    }
    this.skillInput = '';
  }

  removeSkill(index: number) {
    this.skills.splice(index, 1);
  }

  
  updateCharCount() {
    this.charCount = this.description.length;
  }

  
  resetForm() {
    this.jobTitle     = '';
    this.experience   = null;
    this.location     = '';
    this.description  = '';
    this.skills       = [];
    this.skillInput   = '';
    this.selectedFile = null;
    this.charCount    = 0;
  }

  
  submitJob() {
    if (!this.jobTitle.trim()) {
      alert('Job title is required');
      return;
    }

    const jobData = {
      title:       this.jobTitle.trim(),
      experience:  this.experience ? Number(this.experience) : 0,
      skills:      this.skills,
      location:    this.location.trim(),
      description: this.description.trim()
    };

    console.log('Sending job:', jobData);

    this.api.createJob(jobData).subscribe({
      next: (res) => {
        console.log('Saved:', res);
        alert('Job created successfully ✅');
        this.resetForm();
         this.router.navigate(['/jd-details']);
      },
      error: (err) => {
        console.error('Error:', err);
        alert('Failed to create job ❌');
      }
    });
  }
}