import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../Service/ApiService ';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-jd-detailscomponent',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './jd-detailscomponent.html',
  styleUrls: ['./jd-detailscomponent.css'],
})
export class JdDetailscomponent implements OnInit {

  constructor(private api: ApiService) {}

  jobs: any[] = [];
  loading: boolean = true;

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.api.getAllJobs().subscribe({
      next: (res: any[]) => {
        console.log("Jobs:", res);

        this.jobs = res.map(job => ({
          ...job,
          // Fix skills
          skills: Array.isArray(job.skills)
            ? job.skills.length === 1 && job.skills[0].includes(',')
              ? job.skills[0].split(',').map((s: string) => s.trim())
              : job.skills
            : [],
          location: job.location || 'Not Provided',
          description: job.description || 'No description available',
          isExpanded: false
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading jobs", err);
      }
    });
  }

  toggleDescription(job: any) {
    job.isExpanded = !job.isExpanded;
  }
}