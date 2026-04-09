import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';

@Component({
  selector: 'app-dashboardcomponent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboardcomponent.html',
  styleUrls: ['./dashboardcomponent.css'],
})
export class Dashboardcomponent implements OnInit {

  constructor(private api: ApiService) {}

  candidates: any[] = [];
  loading = true; // ✅ loader flag

  stats = [
    { title: 'Total Resumes', value: 0, icon: '📄' },
    { title: 'Shortlisted', value: 0, icon: '✅' },
    { title: 'Rejected', value: 0, icon: '❌' },
    { title: 'Pending', value: 0, icon: '⏳' }
  ];

  ngOnInit() {
    this.loadCandidates();

    // 🔥 AUTO RETRY (important fix)
    setTimeout(() => {
      if (this.candidates.length === 0) {
        this.loadCandidates();
      }
    }, 1000);
  }

  loadCandidates() {
    console.log("Calling API...");

    this.api.getCandidates().subscribe({
      next: (res: any) => {
        console.log("API Response:", res);

        this.candidates = res || [];
        this.loading = false;

        this.updateStats();
      },
      error: (err) => {
        console.error("Error loading candidates", err);
        this.loading = false;
      }
    });
  }

  updateStats() {
    this.stats[0].value = this.candidates.length;
    this.stats[1].value = this.candidates.filter(c => c.status === 'Shortlisted').length;
    this.stats[2].value = this.candidates.filter(c => c.status === 'Rejected').length;
    this.stats[3].value = this.candidates.filter(c => c.status === 'Pending').length;
  }
}